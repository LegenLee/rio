plugins {
    kotlin("jvm") version "2.4.0"
    application
}

kotlin { jvmToolchain(21) }

dependencies {
    // Its code matches androidx 079e2e3, the commit the port follows, apart from explicit-API
    // modifiers and formatting.
    implementation("androidx.graphics:graphics-shapes:1.1.0")
    // graphics-shapes keeps it off the compile classpath, but its TransformResult is a FloatFloatPair.
    implementation("androidx.collection:collection:1.5.0")
}

application { mainClass.set("MainKt") }

tasks.named<JavaExec>("run") {
    // The goldens land next to the TypeScript they test.
    workingDir = rootDir
    args = listOf("../../packages/core/src/primitives/shapes/__goldens__")
}
