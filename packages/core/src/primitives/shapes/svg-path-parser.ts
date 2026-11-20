// Reads an SVG path into a polygon's features.
//
// Ported from androidx graphics-shapes, SvgPathParser.kt, at androidx 079e2e3. Copyright 2024 The
// Android Open Source Project, licensed under the Apache License, Version 2.0. Changed: ported to
// TypeScript; `SvgPathParser.parseFeatures` is `featuresFromSvgPath`, the parser and its commands
// are module internals, numbers are read with Kotlin's rules (`parseFloatStrict`), and the debug
// logging is left out. The arc conversion, which the original copied from graphics/PathParser, is
// ported with it. Differs from the original: quadratic curves (Q, T) become cubics exactly, as SVG
// defines them, with the controls 2/3 of the way to the quadratic's control. The original uses the
// quadratic's control for both, which bulges the curve.

import { parseFloatStrict } from '../../utils/number';
import { straightCubic, type Cubic } from './cubic';
import { detectFeatures } from './feature-detector';
import type { PolygonFeature } from './features';
import { DISTANCE_EPSILON } from './math';
import { Point } from './point';
import { polygonFromFeatures } from './polygon';
import { fixPolygon } from './polygon-validation';

/**
 * The features of the polygon an SVG path describes: a single, closed polygon that doesn't cross
 * itself. Otherwise this throws, or the morphs the polygon goes into come out distorted. Parameters
 * can be separated by spaces or commas; every path command is supported (see
 * https://www.w3.org/TR/SVG/paths.html), with little error handling.
 *
 * Only the first shape in the path counts; later shapes and holes are left out. Numbers run
 * together without a separator, such as `-1.45-1.32` or `3.41.81` as minified icons have them, and
 * exponents (`1e-5`) aren't read: separate the numbers first.
 *
 * Meant for development: in production, keep the result with `serializeFeatures` and read it back
 * with `parseFeatures`, which is faster.
 *
 * @param svgPath The path, as in a `<path>`'s `d` attribute
 * @throws If the path isn't valid, or isn't a closed polygon that doesn't cross itself.
 */
export function featuresFromSvgPath(svgPath: string): PolygonFeature[] {
  const parsedCubics = parseCubics(svgPath);

  const continuous = (first: Cubic, second: Cubic) =>
    Math.abs(second[0] - first[6]) < DISTANCE_EPSILON &&
    Math.abs(second[1] - first[7]) < DISTANCE_EPSILON;

  // From the original: a parameter to choose the shape may come (b/376039669).
  let continuousCubicsCount = parsedCubics.length;
  for (let index = 0; index < parsedCubics.length - 1; index++) {
    if (!continuous(parsedCubics[index]!, parsedCubics[index + 1]!)) {
      // Deviation from the original, which takes `index` cubics: one short, so the first shape
      // loses its last side, and its last cubic is pulled to the start.
      continuousCubicsCount = index + 1;
      break;
    }
  }
  const firstShapeCubics = parsedCubics.slice(0, continuousCubicsCount);

  const parsedPolygon = polygonFromFeatures(detectFeatures(firstShapeCubics));
  return [...fixPolygon(parsedPolygon).features];
}

/** The path's elements as cubics: the data of a path's `d` attribute */
export function parseCubics(svgPath: string): Cubic[] {
  const paths = svgPath.split(/(?=[mM])/).filter(isNotBlank);
  let current = new Point(0, 0);

  // There may be several move-to commands, and later ones can be relative, so each path is
  // finished before the next, for the right start positions.
  const cubics: Cubic[] = [];
  for (const path of paths) {
    const commandStrings = path.split(/(?=[a-zA-Z])/).filter(isNotBlank);

    // Paths start with a move-to command, which sets the start position; its further pairs are
    // line-to commands.
    const moveToCommand = Command.parse(first(commandStrings), current);
    current = moveToCommand.start.plus(new Point(moveToCommand.get(0), moveToCommand.get(1)));

    const parser = new SvgPathParser(current);

    // The move-to is handled; handle its line-tos (if any), then the rest
    parser.parseCommand(moveToCommand.asLine(current));
    for (const command of commandStrings.slice(1)) {
      parser.parseCommand(Command.parse(command, parser.position));
    }
    cubics.push(...parser.cubics);
  }
  return cubics;
}

/** Kotlin's `isNotBlank`: anything but whitespace */
const isNotBlank = (s: string) => s.trim().length > 0;

/** Kotlin's `first()`, which throws on an empty list */
function first<T>(list: readonly T[]): T {
  if (list.length === 0) throw new Error('List is empty.');
  return list[0]!;
}

class SvgPathParser {
  readonly cubics: Cubic[] = [];
  private previousCommand = new Command('I', false, [], 0);
  /** The last quadratic curve's control point, which a T command reflects */
  private previousQuadraticControl = new Point(0, 0);

  constructor(private readonly start: Point) {}

  get position(): Point {
    const last = this.cubics[this.cubics.length - 1];
    return last ? new Point(last[6], last[7]) : this.start;
  }

  private get reflectedPreviousControlPoint(): Point {
    const last = this.cubics[this.cubics.length - 1];
    if (!last) throw new Error('List is empty.');
    return this.position.plus(this.position.minus(new Point(last[4], last[5])));
  }

  parseCommand(command: Command): void {
    if (command.isCloseCommand) {
      this.cubics.push(lineToCubic(this.position, this.start));
      // Differs from the original, which keeps the command before: a T or S after Z reflected
      // that command's control point, where SVG takes the current point.
      this.previousCommand = command;
      return;
    }
    // One SVG command can hold several sets of parameters: split them into single commands.
    // As Kotlin's `step`, a command with no parameter count (an unknown one) throws.
    if (command.paramsCount <= 0) {
      throw new Error(`Step must be positive, was: ${command.paramsCount}.`);
    }
    for (let i = 0; i < command.parameters.length; i += command.paramsCount) {
      this.parseAtomicCommand(command.chunk(i, this.position));
    }
  }

  private parseAtomicCommand(atomicCommand: Command): void {
    if (atomicCommand.isLineCommand) this.parseLine(atomicCommand);
    else if (atomicCommand.isCurveCommand) this.parseCurve(atomicCommand);
    else if (atomicCommand.isArcCommand) this.parseArc(atomicCommand);
    // Unknown commands are ignored.
    this.previousCommand = atomicCommand;
  }

  private parseLine(command: Command): void {
    const addLineTo = (endPoint: Point) => this.cubics.push(lineToCubic(this.position, endPoint));
    switch (command.letter) {
      case 'l':
        addLineTo(command.xy(0, 1));
        break;
      case 'h':
        addLineTo(new Point(command.x(0), command.start.y));
        break;
      case 'v':
        addLineTo(new Point(command.start.x, command.y(0)));
        break;
    }
  }

  private parseCurve(command: Command): void {
    const addCurveWith = (c0: Point, c1: Point, a1: Point) =>
      this.cubics.push(curveToCubic(this.position, c0, c1, a1));
    switch (command.letter) {
      case 'c':
        addCurveWith(command.xy(0, 1), command.xy(2, 3), command.xy(4, 5));
        break;
      case 's': {
        const c0 = this.previousCommand.isBezierCommand
          ? this.reflectedPreviousControlPoint
          : this.position;
        addCurveWith(c0, command.xy(0, 1), command.xy(2, 3));
        break;
      }
      case 'q':
        this.addQuadratic(command.xy(0, 1), command.xy(2, 3));
        break;
      case 't': {
        // The control is the last quadratic's, reflected around the current point, or the current
        // point itself after anything else.
        const position = this.position;
        const control = this.previousCommand.isQuadraticCurveCommand
          ? position.plus(position.minus(this.previousQuadraticControl))
          : position;
        this.addQuadratic(control, command.xy(0, 1));
        break;
      }
    }
  }

  /** A quadratic curve from the current point, as the cubic that draws it exactly */
  private addQuadratic(control: Point, end: Point): void {
    const start = this.position;
    this.cubics.push(
      curveToCubic(
        start,
        start.plus(control.minus(start).times(2 / 3)),
        end.plus(control.minus(end).times(2 / 3)),
        end,
      ),
    );
    this.previousQuadraticControl = control;
  }

  private parseArc(command: Command): void {
    const target = command.xy(5, 6);
    this.cubics.push(
      ...arcToCubics(
        this.position.x,
        this.position.y,
        target.x,
        target.y,
        command.get(0),
        command.get(1),
        command.get(2),
        command.get(3) !== 0,
        command.get(4) !== 0,
      ),
    );
  }
}

const curveToCubic = (a0: Point, c0: Point, c1: Point, a1: Point): Cubic => [
  a0.x,
  a0.y,
  c0.x,
  c0.y,
  c1.x,
  c1.y,
  a1.x,
  a1.y,
];

const lineToCubic = (start: Point, end: Point) => straightCubic(start.x, start.y, end.x, end.y);

const COMMAND_TO_PARAMS_COUNT: Record<string, number> = {
  m: 2,
  l: 2,
  h: 1,
  v: 1,
  c: 6,
  s: 4,
  q: 4,
  t: 2,
  a: 7,
};

/** Kotlin's `Char.isLowerCase` */
const isLowerCase = (c: string) => c === c.toLowerCase() && c !== c.toUpperCase();

class Command {
  constructor(
    readonly letter: string,
    readonly isRelative: boolean,
    readonly parameters: readonly number[],
    readonly paramsCount: number,
    readonly start = new Point(0, 0),
  ) {}

  static parse(input: string, currentPosition: Point): Command {
    const letter = input[0]!;
    const isRelative = isLowerCase(letter);
    const parameters = input
      .slice(1)
      .split(/[ ,]/)
      .filter(isNotBlank)
      .map((s) => parseFloatStrict(s.trim()));
    return new Command(
      letter.toLowerCase(),
      isRelative,
      parameters,
      COMMAND_TO_PARAMS_COUNT[letter.toLowerCase()] ?? 0,
      isRelative ? currentPosition : new Point(0, 0),
    );
  }

  get isLineCommand() {
    return this.letter === 'l' || this.letter === 'h' || this.letter === 'v';
  }
  get isBezierCommand() {
    return this.letter === 'c' || this.letter === 's';
  }
  get isQuadraticCurveCommand() {
    return this.letter === 'q' || this.letter === 't';
  }
  get isCurveCommand() {
    return this.isBezierCommand || this.isQuadraticCurveCommand;
  }
  get isArcCommand() {
    return this.letter === 'a';
  }
  get isCloseCommand() {
    return this.letter === 'z';
  }

  /** The parameter at `i`, throwing past the end as Kotlin's arrays do */
  get(i: number): number {
    if (i < 0 || i >= this.parameters.length) {
      throw new Error(`Index ${i} out of bounds for length ${this.parameters.length}`);
    }
    return this.parameters[i]!;
  }

  x(i: number): number {
    return this.isRelative ? this.start.x + this.get(i) : this.get(i);
  }

  y(i: number): number {
    return this.isRelative ? this.start.y + this.get(i) : this.get(i);
  }

  xy(i: number, j: number): Point {
    const coordinates = new Point(this.get(i), this.get(j));
    return this.isRelative ? this.start.plus(coordinates) : coordinates;
  }

  chunk(index: number, currentPosition: Point): Command {
    // Kotlin's sliceArray throws when the range runs past the end.
    if (index + this.paramsCount > this.parameters.length) {
      throw new Error(
        `toIndex (${index + this.paramsCount}) is greater than size (${this.parameters.length}).`,
      );
    }
    return new Command(
      this.letter,
      this.isRelative,
      this.parameters.slice(index, index + this.paramsCount),
      this.paramsCount,
      currentPosition,
    );
  }

  asLine(newStart: Point): Command {
    return new Command('l', this.isRelative, this.parameters.slice(this.paramsCount), 2, newStart);
  }
}

// The arc conversion, which the original copied and slightly adjusted from graphics/PathParser to
// leave out its Path dependency (from the original: until a multiplatform SVG parser with arcs
// exists, b/370041761)

function arcToCubics(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  a: number,
  b: number,
  theta: number,
  isMoreThanHalf: boolean,
  isPositiveArc: boolean,
): Cubic[] {
  // The rotation angle, from degrees to radians
  const thetaD = (theta / 180) * Math.PI;
  // The rotation matrix's entries
  const cosTheta = Math.cos(thetaD);
  const sinTheta = Math.sin(thetaD);
  // (x0, y0) and (x1, y1) in unit space, by the (inverse) rotation, then the (inverse) scale
  const x0p = (x0 * cosTheta + y0 * sinTheta) / a;
  const y0p = (-x0 * sinTheta + y0 * cosTheta) / b;
  const x1p = (x1 * cosTheta + y1 * sinTheta) / a;
  const y1p = (-x1 * sinTheta + y1 * cosTheta) / b;

  // Differences and averages
  const dx = x0p - x1p;
  const dy = y0p - y1p;
  const xm = (x0p + x1p) / 2;
  const ym = (y0p + y1p) / 2;
  // Solve for intersecting unit circles
  const dsq = dx * dx + dy * dy;
  if (dsq === 0) return []; // The points coincide
  const disc = 1 / dsq - 1 / 4;
  if (disc < 0) {
    // The points are too far apart
    const adjust = Math.sqrt(dsq) / 1.99999;
    return arcToCubics(
      x0,
      y0,
      x1,
      y1,
      a * adjust,
      b * adjust,
      theta,
      isMoreThanHalf,
      isPositiveArc,
    );
  }
  const s = Math.sqrt(disc);
  const sdx = s * dx;
  const sdy = s * dy;
  let cx: number;
  let cy: number;
  if (isMoreThanHalf === isPositiveArc) {
    cx = xm - sdy;
    cy = ym + sdx;
  } else {
    cx = xm + sdy;
    cy = ym - sdx;
  }

  const eta0 = Math.atan2(y0p - cy, x0p - cx);
  const eta1 = Math.atan2(y1p - cy, x1p - cx);

  let sweep = eta1 - eta0;
  if (isPositiveArc !== sweep >= 0) {
    if (sweep > 0) sweep -= 2 * Math.PI;
    else sweep += 2 * Math.PI;
  }

  cx *= a;
  cy *= b;
  const tcx = cx;
  cx = cx * cosTheta - cy * sinTheta;
  cy = tcx * sinTheta + cy * cosTheta;

  return arcToBezier(cx, cy, a, b, x0, y0, thetaD, eta0, sweep);
}

/**
 * An arc as cubic Bézier segments, at most 45 degrees each.
 *
 * @param cx The x coordinate of the ellipse's center
 * @param cy The y coordinate of the ellipse's center
 * @param rx The ellipse's horizontal radius
 * @param ry The ellipse's vertical radius
 * @param e1x E(eta1), the x coordinate of the arc's start
 * @param e1y E(eta2), the y coordinate of the arc's start
 * @param theta The angle of the ellipse's bounding rectangle to the horizontal
 * @param start The start angle of the arc on the ellipse
 * @param sweep The angle (positive or negative) the arc sweeps on the ellipse
 */
function arcToBezier(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  e1x: number,
  e1y: number,
  theta: number,
  start: number,
  sweep: number,
): Cubic[] {
  const cubics: Cubic[] = [];

  // From the equations at http://spaceroots.org/documents/ellipse/node8.html and
  // http://www.spaceroots.org/documents/ellipse/node22.html. At most 45 degrees per cubic.
  let ce1x = e1x;
  let ce1y = e1y;
  // Differs from Android: there sweep is a Float, so a 90 degree arc's comes out a little over
  // pi/2 and takes 3 segments. Here it takes 2, at 45 degrees each, as meant: the count allows for
  // a sweep that comes out of atan2 a rounding error over a multiple of 45 degrees.
  const numSegments = Math.ceil(Math.abs((sweep * 4) / Math.PI) * (1 - 1e-12));

  let eta1 = start;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosEta1 = Math.cos(eta1);
  const sinEta1 = Math.sin(eta1);
  let ep1x = -rx * cosTheta * sinEta1 - ry * sinTheta * cosEta1;
  let ep1y = -rx * sinTheta * sinEta1 + ry * cosTheta * cosEta1;

  const anglePerSegment = sweep / numSegments;
  for (let i = 0; i < numSegments; i++) {
    const eta2 = eta1 + anglePerSegment;
    const sinEta2 = Math.sin(eta2);
    const cosEta2 = Math.cos(eta2);
    const e2x = cx + rx * cosTheta * cosEta2 - ry * sinTheta * sinEta2;
    const e2y = cy + rx * sinTheta * cosEta2 + ry * cosTheta * sinEta2;
    const ep2x = -rx * cosTheta * sinEta2 - ry * sinTheta * cosEta2;
    const ep2y = -rx * sinTheta * sinEta2 + ry * cosTheta * cosEta2;
    const tanDiff2 = Math.tan((eta2 - eta1) / 2);
    const alpha = (Math.sin(eta2 - eta1) * (Math.sqrt(4 + 3 * tanDiff2 * tanDiff2) - 1)) / 3;
    const q1x = ce1x + alpha * ep1x;
    const q1y = ce1y + alpha * ep1y;
    const q2x = e2x - alpha * ep2x;
    const q2y = e2y - alpha * ep2y;

    cubics.push([ce1x, ce1y, q1x, q1y, q2x, q2y, e2x, e2y]);
    eta1 = eta2;
    ce1x = e2x;
    ce1y = e2y;
    ep1x = ep2x;
    ep1y = ep2y;
  }
  return cubics;
}
