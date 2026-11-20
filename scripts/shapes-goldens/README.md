# shapes-goldens

Writes the reference data ("goldens") that the TypeScript port of androidx graphics-shapes in `packages/core/src/primitives/shapes/` is tested against. It runs the real Kotlin library on the JVM and records its output, with the input of each case, in `packages/core/src/primitives/shapes/__goldens__/`:

| File                     | What it records                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `polygons.json`          | Polygons from each constructor and shape function, transformed and normalized ones, and the 35 `MaterialShapes`: features, cubics, bounds |
| `morphs.json`            | Morphs, including the loading indicator's sequences, at progress values from -0.1 to 1.15 (a spring overshoots)                           |
| `svg.json`               | `SvgPathParser.parseFeatures` on SVG paths, and the polygons built from them, or the error                                                |
| `serializer.json`        | `FeatureSerializer.serialize` and `parse`                                                                                                 |
| `loading-indicator.json` | The loading indicator's scale factors                                                                                                     |

The goldens are committed, and the tests only read them: neither CI nor `pnpm test` needs a JVM. Rerun the generator when the port moves to a newer androidx commit, or to add cases.

## Running it

Needs JDK 21. The Gradle wrapper fetches Gradle, the Kotlin plugin, and graphics-shapes.

```sh
cd scripts/shapes-goldens
./gradlew run
```

## Which code it runs

The port follows androidx at `079e2e3` (2026-11-10). The generator runs `androidx.graphics:graphics-shapes:1.1.0` from Google's Maven repository, whose code matches that commit apart from explicit-API modifiers and formatting. When moving the port to a newer commit, check that a release still matches it, or build graphics-shapes from that commit instead.

`MaterialShapes` lives in Compose Material3, which the generator doesn't depend on. `src/main/kotlin/MaterialShapes.kt` is a copy of the file at the same commit, made by `copy-material-shapes.mjs`, which removes its Compose-only `toPath` and `toShape` extensions. `ComposeCompat.kt` stands in for the Compose types the rest of it uses (`Offset`, and `Matrix` for rotation and scaling). To refresh the copy:

```sh
node copy-material-shapes.mjs <androidx checkout>/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt
```

The code here is derived from the Android Open Source Project and licensed under the Apache License, Version 2.0, as the files' headers say.
