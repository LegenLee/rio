/*
 * The few Compose UI types that MaterialShapes.kt (copied from Compose Material3) and the loading
 * indicator use, so the generator runs on graphics-shapes alone. Each follows its Compose
 * counterpart for 2D affine transforms: `Offset` from androidx.compose.ui.geometry, `Matrix` from
 * androidx.compose.ui.graphics (rotateZ, scale, map), and the internal `RoundedPolygon.transformed`
 * from androidx.compose.material3.internal.ShapeUtil.
 */

package androidx.compose.material3

import androidx.graphics.shapes.RoundedPolygon
import androidx.graphics.shapes.TransformResult
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

@RequiresOptIn @Retention(AnnotationRetention.BINARY) annotation class ExperimentalMaterial3ExpressiveApi

data class Offset(val x: Float, val y: Float) {
    operator fun minus(o: Offset) = Offset(x - o.x, y - o.y)
    operator fun plus(o: Offset) = Offset(x + o.x, y + o.y)
    operator fun times(f: Float) = Offset(x * f, y * f)
    fun getDistance() = sqrt(x * x + y * y)

    companion object {
        val Zero = Offset(0f, 0f)
    }
}

/** A 2D affine transform: x' = a x + c y + e, y' = b x + d y + f, as Compose's 4x4 Matrix in 2D. */
class Matrix {
    private var a = 1f
    private var b = 0f
    private var c = 0f
    private var d = 1f
    private var e = 0f
    private var f = 0f

    fun rotateZ(degrees: Float) {
        val r = degrees * (PI / 180.0)
        val s = sin(r)
        val co = cos(r)
        val na = co * a + s * c
        val nb = co * b + s * d
        val nc = -s * a + co * c
        val nd = -s * b + co * d
        a = na.toFloat()
        b = nb.toFloat()
        c = nc.toFloat()
        d = nd.toFloat()
    }

    fun scale(x: Float = 1f, y: Float = 1f) {
        a *= x
        b *= x
        c *= y
        d *= y
    }

    fun map(p: Offset) = Offset(a * p.x + c * p.y + e, b * p.x + d * p.y + f)
}

internal fun RoundedPolygon.transformed(matrix: Matrix): RoundedPolygon = transformed { x, y ->
    val transformedPoint = matrix.map(Offset(x, y))
    TransformResult(transformedPoint.x, transformedPoint.y)
}

internal inline fun <T, R> List<T>.fastMap(transform: (T) -> R): List<R> = map(transform)
