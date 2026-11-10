import { colorVar } from './color'
import { TOKEN_PREFIX } from './prefix'

export const ELEVATION_LEVELS = [0, 1, 2, 3, 4, 5] as const

/** 0~3은 쉬는 상태, 4~5는 hover/drag 같은 상호작용 상태 전용. */
export type ElevationLevel = (typeof ELEVATION_LEVELS)[number]

export type ElevationVar = `${typeof TOKEN_PREFIX}-elevation-level${ElevationLevel}`

type Layer = readonly [y: number, blur: number, spread: number]

/**
 * M3 Figma 디자인 킷의 `M3/Elevation` 효과 스타일. 라이트/다크 값이 같다.
 * 레벨마다 가까운 그림자(30%)와 먼 그림자(15%) 두 겹.
 */
const SHADOWS: Record<Exclude<ElevationLevel, 0>, readonly [key: Layer, ambient: Layer]> = {
  1: [[1, 2, 0], [1, 3, 1]],
  2: [[1, 2, 0], [2, 6, 2]],
  3: [[1, 3, 0], [4, 8, 3]],
  4: [[2, 3, 0], [6, 10, 4]],
  5: [[4, 4, 0], [8, 12, 6]],
}

/** 레벨의 CSS 변수 이름. `3` → `--rio-elevation-level3` */
export function elevationVar(level: ElevationLevel): ElevationVar {
  return `${TOKEN_PREFIX}-elevation-level${level}`
}

const layer = ([y, blur, spread]: Layer, opacity: number) =>
  `0 ${y}px ${blur}px ${spread}px color-mix(in srgb, var(${colorVar('shadow')}) ${opacity}%, transparent)`

/** 레벨별 `box-shadow` 값. 그림자 색은 테마의 shadow 역할을 따른다. */
export function createElevationVariables(): Record<ElevationVar, string> {
  const vars = { [elevationVar(0)]: 'none' } as Record<ElevationVar, string>
  for (const level of ELEVATION_LEVELS) {
    if (level === 0) continue
    const [key, ambient] = SHADOWS[level]
    vars[elevationVar(level)] = `${layer(key, 30)}, ${layer(ambient, 15)}`
  }
  return vars
}
