/*
 * Writes the reference data ("goldens") for the TypeScript port of androidx graphics-shapes and
 * Compose's MaterialShapes in packages/core/src/primitives/shapes. Each case records its input, so
 * the TypeScript tests can build the same thing and compare. See README.md.
 */

@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.MaterialShapes
import androidx.compose.material3.Matrix
import androidx.compose.material3.transformed
import androidx.graphics.shapes.CornerRounding
import androidx.graphics.shapes.Cubic
import androidx.graphics.shapes.Feature
import androidx.graphics.shapes.FeatureSerializer
import androidx.graphics.shapes.Morph
import androidx.graphics.shapes.RoundedPolygon
import androidx.graphics.shapes.SvgPathParser
import androidx.graphics.shapes.TransformResult
import androidx.graphics.shapes.circle
import androidx.graphics.shapes.pill
import androidx.graphics.shapes.pillStar
import androidx.graphics.shapes.rectangle
import androidx.graphics.shapes.star
import java.io.File
import kotlin.math.max
import kotlin.math.min

// JSON, written by hand to keep the generator free of dependencies

sealed interface J

class JObj(val entries: List<Pair<String, J>>) : J

class JArr(val items: List<J>) : J

class JRaw(val text: String) : J

fun obj(vararg entries: Pair<String, J?>) = JObj(entries.mapNotNull { (k, v) -> v?.let { k to it } })

fun arr(items: List<J>) = JArr(items)

fun num(f: Float): J {
    require(f.isFinite()) { "Not a JSON number: $f" }
    return JRaw(f.toString())
}

fun num(i: Int): J = JRaw(i.toString())

fun str(s: String): J =
    JRaw(
        buildString {
            append('"')
            for (c in s) {
                when {
                    c == '"' -> append("\\\"")
                    c == '\\' -> append("\\\\")
                    c == '\n' -> append("\\n")
                    c < ' ' -> append("\\u%04x".format(c.code))
                    else -> append(c)
                }
            }
            append('"')
        }
    )

fun bool(b: Boolean): J = JRaw(b.toString())

fun nums(fs: FloatArray): J = arr(fs.map { num(it) })

/** Arrays of numbers (and empty ones) stay on one line, so a cubic is one line of the file. */
fun render(j: J, indent: String = ""): String =
    when (j) {
        is JRaw -> j.text
        is JArr ->
            if (j.items.all { it is JRaw }) j.items.joinToString(", ", "[", "]") { render(it) }
            else
                j.items.joinToString(",\n", "[\n", "\n$indent]") {
                    "$indent  " + render(it, "$indent  ")
                }
        is JObj ->
            if (j.entries.isEmpty()) "{}"
            else
                j.entries.joinToString(",\n", "{\n", "\n$indent}") { (k, v) ->
                    "$indent  \"$k\": " + render(v, "$indent  ")
                }
    }

// What a golden records about the library's objects

fun cubic(c: Cubic): J =
    nums(
        floatArrayOf(
            c.anchor0X,
            c.anchor0Y,
            c.control0X,
            c.control0Y,
            c.control1X,
            c.control1Y,
            c.anchor1X,
            c.anchor1Y,
        )
    )

fun cubics(cs: List<Cubic>): J = arr(cs.map { cubic(it) })

fun feature(f: Feature): J =
    obj(
        "type" to str(if (f.isEdge) "edge" else "corner"),
        "convex" to (if (f.isEdge) null else bool(f.isConvexCorner)),
        "cubics" to cubics(f.cubics),
    )

fun polygon(p: RoundedPolygon): J =
    obj(
        "center" to nums(floatArrayOf(p.centerX, p.centerY)),
        "features" to arr(p.features.map { feature(it) }),
        "cubics" to cubics(p.cubics),
        "bounds" to nums(p.calculateBounds()),
        "exactBounds" to nums(p.calculateBounds(approximate = false)),
        "maxBounds" to nums(p.calculateMaxBounds()),
    )

// Inputs: how to build each polygon, in the library's own parameter names

class Input(val json: J, val build: () -> RoundedPolygon)

fun rounding(r: CornerRounding): J = obj("radius" to num(r.radius), "smoothing" to num(r.smoothing))

fun roundings(rs: List<CornerRounding>?): J? = rs?.let { arr(it.map { r -> rounding(r) }) }

fun input(fn: String, vararg args: Pair<String, J?>, build: () -> RoundedPolygon) =
    Input(obj("fn" to str(fn), "args" to obj(*args)), build)

/** A polygon, then transforms applied in order: rotate (degrees), scale, translate, or normalize. */
fun then(base: Input, vararg steps: Pair<String, J>, build: (RoundedPolygon) -> RoundedPolygon) =
    Input(
        obj("fn" to str("then"), "base" to base.json, "steps" to arr(steps.map { obj(it) })),
    ) {
        build(base.build())
    }

fun rotate(degrees: Float) = Matrix().apply { rotateZ(degrees) }

val unrounded = CornerRounding.Unrounded
val r10 = CornerRounding(0.1f)
val r20 = CornerRounding(0.2f)
val r30s50 = CornerRounding(0.3f, 0.5f)
val r50s100 = CornerRounding(0.5f, 1f)

fun regular(
    numVertices: Int,
    radius: Float = 1f,
    centerX: Float = 0f,
    centerY: Float = 0f,
    rounding: CornerRounding = unrounded,
    perVertexRounding: List<CornerRounding>? = null,
) =
    input(
        "roundedPolygon",
        "numVertices" to num(numVertices),
        "radius" to num(radius),
        "centerX" to num(centerX),
        "centerY" to num(centerY),
        "rounding" to rounding(rounding),
        "perVertexRounding" to roundings(perVertexRounding),
    ) {
        RoundedPolygon(numVertices, radius, centerX, centerY, rounding, perVertexRounding)
    }

fun vertices(
    vertices: FloatArray,
    rounding: CornerRounding = unrounded,
    perVertexRounding: List<CornerRounding>? = null,
    centerX: Float? = null,
    centerY: Float? = null,
) =
    input(
        "roundedPolygon",
        "vertices" to nums(vertices),
        "rounding" to rounding(rounding),
        "perVertexRounding" to roundings(perVertexRounding),
        "centerX" to centerX?.let { num(it) },
        "centerY" to centerY?.let { num(it) },
    ) {
        if (centerX != null && centerY != null) {
            RoundedPolygon(vertices, rounding, perVertexRounding, centerX, centerY)
        } else {
            RoundedPolygon(vertices, rounding, perVertexRounding)
        }
    }

fun circle(numVertices: Int = 8, radius: Float = 1f, centerX: Float = 0f, centerY: Float = 0f) =
    input(
        "circle",
        "numVertices" to num(numVertices),
        "radius" to num(radius),
        "centerX" to num(centerX),
        "centerY" to num(centerY),
    ) {
        RoundedPolygon.circle(numVertices, radius, centerX, centerY)
    }

fun rectangle(
    width: Float = 2f,
    height: Float = 2f,
    rounding: CornerRounding = unrounded,
    perVertexRounding: List<CornerRounding>? = null,
    centerX: Float = 0f,
    centerY: Float = 0f,
) =
    input(
        "rectangle",
        "width" to num(width),
        "height" to num(height),
        "rounding" to rounding(rounding),
        "perVertexRounding" to roundings(perVertexRounding),
        "centerX" to num(centerX),
        "centerY" to num(centerY),
    ) {
        RoundedPolygon.rectangle(width, height, rounding, perVertexRounding, centerX, centerY)
    }

fun star(
    numVerticesPerRadius: Int,
    radius: Float = 1f,
    innerRadius: Float = .5f,
    rounding: CornerRounding = unrounded,
    innerRounding: CornerRounding? = null,
    perVertexRounding: List<CornerRounding>? = null,
    centerX: Float = 0f,
    centerY: Float = 0f,
) =
    input(
        "star",
        "numVerticesPerRadius" to num(numVerticesPerRadius),
        "radius" to num(radius),
        "innerRadius" to num(innerRadius),
        "rounding" to rounding(rounding),
        "innerRounding" to innerRounding?.let { rounding(it) },
        "perVertexRounding" to roundings(perVertexRounding),
        "centerX" to num(centerX),
        "centerY" to num(centerY),
    ) {
        RoundedPolygon.star(
            numVerticesPerRadius,
            radius,
            innerRadius,
            rounding,
            innerRounding,
            perVertexRounding,
            centerX,
            centerY,
        )
    }

fun pill(
    width: Float = 2f,
    height: Float = 1f,
    smoothing: Float = 0f,
    centerX: Float = 0f,
    centerY: Float = 0f,
) =
    input(
        "pill",
        "width" to num(width),
        "height" to num(height),
        "smoothing" to num(smoothing),
        "centerX" to num(centerX),
        "centerY" to num(centerY),
    ) {
        RoundedPolygon.pill(width, height, smoothing, centerX, centerY)
    }

fun pillStar(
    width: Float = 2f,
    height: Float = 1f,
    numVerticesPerRadius: Int = 8,
    innerRadiusRatio: Float = .5f,
    rounding: CornerRounding = unrounded,
    innerRounding: CornerRounding? = null,
    perVertexRounding: List<CornerRounding>? = null,
    vertexSpacing: Float = 0.5f,
    startLocation: Float = 0f,
    centerX: Float = 0f,
    centerY: Float = 0f,
) =
    input(
        "pillStar",
        "width" to num(width),
        "height" to num(height),
        "numVerticesPerRadius" to num(numVerticesPerRadius),
        "innerRadiusRatio" to num(innerRadiusRatio),
        "rounding" to rounding(rounding),
        "innerRounding" to innerRounding?.let { rounding(it) },
        "perVertexRounding" to roundings(perVertexRounding),
        "vertexSpacing" to num(vertexSpacing),
        "startLocation" to num(startLocation),
        "centerX" to num(centerX),
        "centerY" to num(centerY),
    ) {
        RoundedPolygon.pillStar(
            width,
            height,
            numVerticesPerRadius,
            innerRadiusRatio,
            rounding,
            innerRounding,
            perVertexRounding,
            vertexSpacing,
            startLocation,
            centerX,
            centerY,
        )
    }

/** Compose's names for the shapes, with the kebab-case ids Rio gives them */
val materialShapes: List<Pair<String, () -> RoundedPolygon>> =
    listOf(
        "circle" to { MaterialShapes.Circle },
        "square" to { MaterialShapes.Square },
        "slanted" to { MaterialShapes.Slanted },
        "arch" to { MaterialShapes.Arch },
        "fan" to { MaterialShapes.Fan },
        "arrow" to { MaterialShapes.Arrow },
        "semi-circle" to { MaterialShapes.SemiCircle },
        "oval" to { MaterialShapes.Oval },
        "pill" to { MaterialShapes.Pill },
        "triangle" to { MaterialShapes.Triangle },
        "diamond" to { MaterialShapes.Diamond },
        "clam-shell" to { MaterialShapes.ClamShell },
        "pentagon" to { MaterialShapes.Pentagon },
        "gem" to { MaterialShapes.Gem },
        "sunny" to { MaterialShapes.Sunny },
        "very-sunny" to { MaterialShapes.VerySunny },
        "cookie-4-sided" to { MaterialShapes.Cookie4Sided },
        "cookie-6-sided" to { MaterialShapes.Cookie6Sided },
        "cookie-7-sided" to { MaterialShapes.Cookie7Sided },
        "cookie-9-sided" to { MaterialShapes.Cookie9Sided },
        "cookie-12-sided" to { MaterialShapes.Cookie12Sided },
        "ghostish" to { MaterialShapes.Ghostish },
        "clover-4-leaf" to { MaterialShapes.Clover4Leaf },
        "clover-8-leaf" to { MaterialShapes.Clover8Leaf },
        "burst" to { MaterialShapes.Burst },
        "soft-burst" to { MaterialShapes.SoftBurst },
        "boom" to { MaterialShapes.Boom },
        "soft-boom" to { MaterialShapes.SoftBoom },
        "flower" to { MaterialShapes.Flower },
        "puffy" to { MaterialShapes.Puffy },
        "puffy-diamond" to { MaterialShapes.PuffyDiamond },
        "pixel-circle" to { MaterialShapes.PixelCircle },
        "pixel-triangle" to { MaterialShapes.PixelTriangle },
        "bun" to { MaterialShapes.Bun },
        "heart" to { MaterialShapes.Heart },
    )

fun material(name: String): Input {
    val build = materialShapes.first { it.first == name }.second
    return input("materialShape", "name" to str(name)) { build() }
}

val square = floatArrayOf(1f, 1f, -1f, 1f, -1f, -1f, 1f, -1f)
// Concave: an arrow head pointing up, its notch at the bottom
val arrowHead = floatArrayOf(0f, -1f, 1f, 1f, 0f, 0.4f, -1f, 1f)
// A concave L, off the origin
val lShape = floatArrayOf(2f, 2f, 6f, 2f, 6f, 3f, 3f, 3f, 3f, 6f, 2f, 6f)

val polygonCases: List<Pair<String, Input>> =
    listOf(
        "triangle" to regular(3),
        "hexagon-offset" to regular(6, radius = 2f, centerX = 1f, centerY = -3f),
        "pentagon-rounded" to regular(5, rounding = r20),
        "octagon-smoothed" to regular(8, rounding = r30s50),
        "square-fully-rounded" to regular(4, rounding = CornerRounding(1f)),
        "square-over-rounded" to regular(4, rounding = CornerRounding(3f, 1f)),
        "square-per-vertex" to regular(4, perVertexRounding = listOf(r10, r20, r30s50, unrounded)),
        "vertices-square" to vertices(square),
        "vertices-square-rounded" to vertices(square, rounding = r50s100),
        "vertices-arrow-head" to vertices(arrowHead, rounding = r20),
        "vertices-l-shape" to
            vertices(
                lShape,
                perVertexRounding = listOf(r20, r10, r10, r50s100, r10, r20),
            ),
        "vertices-l-shape-centered" to vertices(lShape, rounding = r10, centerX = 4f, centerY = 4f),
        "circle-default" to circle(),
        "circle-4" to circle(4),
        "circle-10-offset" to circle(10, radius = 2f, centerX = 3f, centerY = 1f),
        "rectangle-default" to rectangle(),
        "rectangle-wide-rounded" to rectangle(4f, 1f, rounding = r20, centerX = 1f),
        "rectangle-per-vertex" to
            rectangle(1f, 3f, perVertexRounding = listOf(r10, r20, r30s50, r50s100)),
        "star-5" to star(5),
        "star-5-rounded" to star(5, innerRadius = .4f, rounding = r20, innerRounding = r10),
        "star-8-smoothed" to star(8, radius = 2f, innerRadius = .7f, rounding = r30s50),
        "star-4-per-vertex" to
            star(4, perVertexRounding = List(8) { if (it % 2 == 0) r20 else r50s100 }),
        "pill-default" to pill(),
        "pill-tall-smoothed" to pill(1f, 3f, smoothing = 0.5f, centerX = 1f, centerY = 1f),
        "pill-star-default" to pillStar(),
        "pill-star-rounded" to
            pillStar(3f, 1f, numVerticesPerRadius = 6, innerRadiusRatio = .7f, rounding = r10),
        "pill-star-spacing" to
            pillStar(
                1f,
                2f,
                numVerticesPerRadius = 10,
                innerRadiusRatio = .8f,
                rounding = r30s50,
                innerRounding = r10,
                vertexSpacing = 0.8f,
                startLocation = 0.3f,
            ),
        "rotated" to
            then(regular(5, rounding = r20), "rotate" to num(30f)) {
                it.transformed(rotate(30f))
            },
        "scaled-translated" to
            then(star(6, rounding = r10), "scale" to nums(floatArrayOf(2f, 0.5f)),
                "translate" to nums(floatArrayOf(1f, -2f))) {
                it.transformed { x, y -> TransformResult(x * 2f + 1f, y * 0.5f - 2f) }
            },
        "normalized" to
            then(rectangle(4f, 1f, rounding = r20, centerX = 1f), "normalize" to bool(true)) {
                it.normalized()
            },
        "normalized-star" to
            then(star(7, radius = 3f, rounding = r30s50), "normalize" to bool(true)) {
                it.normalized()
            },
    ) + materialShapes.map { (name, _) -> "material-$name" to material(name) }

fun polygonsGolden(): J =
    arr(polygonCases.map { (name, input) -> obj("name" to str(name), "input" to input.json, "polygon" to polygon(input.build())) })

// Morphs

val progressSteps = listOf(-0.1f, 0f, 0.1f, 0.25f, 0.5f, 0.75f, 0.9f, 1f, 1.15f)

fun morph(name: String, start: Input, end: Input): J {
    // As the loading indicator builds them: both ends normalized
    val m = Morph(start.build().normalized(), end.build().normalized())
    return obj(
        "name" to str(name),
        "start" to start.json,
        "end" to end.json,
        "normalized" to bool(true),
        "bounds" to nums(m.calculateBounds()),
        "exactBounds" to nums(m.calculateBounds(approximate = false)),
        "maxBounds" to nums(m.calculateMaxBounds()),
        "frames" to
            arr(progressSteps.map { p -> obj("progress" to num(p), "cubics" to cubics(m.asCubics(p))) }),
    )
}

fun rawMorph(name: String, start: Input, end: Input): J {
    val m = Morph(start.build(), end.build())
    return obj(
        "name" to str(name),
        "start" to start.json,
        "end" to end.json,
        "normalized" to bool(false),
        "bounds" to nums(m.calculateBounds()),
        "exactBounds" to nums(m.calculateBounds(approximate = false)),
        "maxBounds" to nums(m.calculateMaxBounds()),
        "frames" to
            arr(listOf(0f, 0.3f, 0.6f, 1f).map { p -> obj("progress" to num(p), "cubics" to cubics(m.asCubics(p))) }),
    )
}

// The loading indicator's sequences, from LoadingIndicatorDefaults
val indeterminate =
    listOf("soft-burst", "cookie-9-sided", "pentagon", "pill", "sunny", "cookie-4-sided", "oval")

val determinateCircle =
    then(material("circle"), "rotate" to num(360f / 20)) { it.transformed(rotate(360f / 20)) }

fun morphsGolden(): J =
    arr(
        indeterminate.indices.map { i ->
            val a = indeterminate[i]
            val b = indeterminate[(i + 1) % indeterminate.size]
            morph("indeterminate-$a-to-$b", material(a), material(b))
        } +
            listOf(
                morph("determinate", determinateCircle, material("soft-burst")),
                morph("triangle-to-square", regular(3), rectangle()),
                morph("star-to-circle", star(5, rounding = r10), circle(8)),
                morph("hexagon-to-star", regular(6, rounding = r20), star(8, rounding = r10, innerRounding = r30s50)),
                morph("heart-to-pixel-circle", material("heart"), material("pixel-circle")),
                morph("arrow-head-to-l-shape", vertices(arrowHead, rounding = r20), vertices(lShape, rounding = r10)),
                rawMorph("raw-offset-shapes", regular(5, centerX = 2f, centerY = 2f, rounding = r20), circle(6, radius = 3f)),
                rawMorph("raw-pill-to-rectangle", pill(), rectangle(2f, 1f, rounding = r20)),
            )
    )

// SVG paths: the parser tests' inputs, and paths with arcs and quadratic curves

val svgPaths =
    listOf(
        "M 10,10 L 30,10 L 20,30 z",
        "M10,10L30,10L20,30z",
        "m 10,10 l 20,0 l -10,20 z",
        "M-10.5555,10.5L-30.5555,10.5L-20.5555,30z",
        "M 10,10 H 30 40 V 20 Z",
        "M 0,0 C 10,10 30,20, 10,10 C 23, 23 48,40 20,20 z",
        "M 0,0 C 0,10 10,10 10,0 S 20,-10 20,0 z",
        "M 0,0 Q 10,10 20,0 T 40,0 L 40,20 L 0,20 Z",
        "M 0,0 q 10,10 20,0 t 20,0 l 0,20 l -40,0 z",
        "M 10,0 A 10,10 0 0 1 20,10 L 0,10 Z",
        "M 0,10 A 10,5 30 1 0 20,10 A 10,5 30 1 0 0,10 Z",
        "M 4,0 H 16 A 4,4 0 0 1 20,4 V 16 A 4,4 0 0 1 16,20 H 4 A 4,4 0 0 1 0,16 V 4 A 4,4 0 0 1 4,0 Z",
        // A Material Symbols "favorite" outline. The parser doesn't take numbers run together
        // ("-1.45-1.32", "3.41.81"), so the compact form fails and the spaced one parses.
        "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
        "M 12 21.35 l -1.45 -1.32 C 5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3 c 1.74 0 3.41 0.81 4.5 2.09 C 13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5 c 0 3.78 -3.4 6.86 -8.55 11.54 L 12 21.35 z",
        "M 10,10 30,10 20,30 z M 20,20 50,10 40,30 z",
    )

fun svgGolden(): J =
    arr(
        svgPaths.map { path ->
            val features = runCatching { SvgPathParser.parseFeatures(path) }
            val polygon = features.mapCatching { RoundedPolygon(it) }
            obj(
                "path" to str(path),
                "features" to features.getOrNull()?.let { fs -> arr(fs.map { feature(it) }) },
                "error" to features.exceptionOrNull()?.let { str(it::class.simpleName ?: "Error") },
                "polygon" to polygon.getOrNull()?.let { polygon(it) },
                "polygonError" to
                    if (features.isSuccess) polygon.exceptionOrNull()?.let { str(it::class.simpleName ?: "Error") } else null,
            )
        }
    )

// FeatureSerializer

fun serializerGolden(): J =
    obj(
        "serialize" to
            arr(
                listOf(
                    "pentagon-rounded" to regular(5, rounding = r20),
                    "star-5" to star(5),
                    "material-heart" to material("heart"),
                    "material-pixel-triangle" to material("pixel-triangle"),
                ).map { (name, input) ->
                    val features = input.build().features
                    obj(
                        "name" to str(name),
                        "input" to input.json,
                        "serialized" to str(FeatureSerializer.serialize(features)),
                    )
                }
            ),
        "parse" to
            arr(
                listOf(
                    // From FeatureSerializerTest
                    "V1 n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10",
                    "n1,1,2,2,3,3,4,4x4,4,5,5,6,6,7,7o7,7,8,8,9,9,10,10",
                    "V1       n  1 ,  1  ,2  ,  2 , 3  ,  3  , 4 , 4   ",
                    "V1o1 1 2 2 3 3 4 4",
                    FeatureSerializer.serialize(RoundedPolygon(4, rounding = r20).features),
                ).map { text ->
                    val features = runCatching { FeatureSerializer.parse(text) }
                    obj(
                        "serialized" to str(text),
                        "features" to features.getOrNull()?.let { fs -> arr(fs.map { feature(it) }) },
                        "error" to features.exceptionOrNull()?.let { str(it::class.simpleName ?: "Error") },
                    )
                }
            ),
    )

// The loading indicator's scale factor (LoadingIndicator.kt's calculateScaleFactor)

fun scaleFactor(polygons: List<RoundedPolygon>): Float {
    var scaleFactor = 1f
    for (polygon in polygons) {
        val bounds = polygon.calculateBounds()
        val maxBounds = polygon.calculateMaxBounds()
        val scaleX = (bounds[2] - bounds[0]) / (maxBounds[2] - maxBounds[0])
        val scaleY = (bounds[3] - bounds[1]) / (maxBounds[3] - maxBounds[1])
        scaleFactor = min(scaleFactor, max(scaleX, scaleY))
    }
    return scaleFactor
}

fun loadingIndicatorGolden(): J =
    obj(
        "activeIndicatorScale" to num(38f / 48f),
        "indeterminateScaleFactor" to scaleFactor(indeterminate.map { material(it).build() }).let { num(it) },
        "determinateScaleFactor" to
            scaleFactor(listOf(determinateCircle.build(), material("soft-burst").build())).let { num(it) },
    )

fun main(args: Array<String>) {
    val out = File(args.single())
    out.mkdirs()
    val files =
        mapOf(
            "polygons.json" to polygonsGolden(),
            "morphs.json" to morphsGolden(),
            "svg.json" to svgGolden(),
            "serializer.json" to serializerGolden(),
            "loading-indicator.json" to loadingIndicatorGolden(),
        )
    for ((name, json) in files) {
        File(out, name).writeText(render(json) + "\n")
        println("${File(out, name).path}: ${File(out, name).length() / 1024} KB")
    }
}
