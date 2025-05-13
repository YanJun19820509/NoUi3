import { ccclass, color, Color, Component, Enum, property } from "../../yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Thu Oct 17 2024 17:43:15 GMT+0800 (中国标准时间)
 *
 */

enum GradientType {
    LINEAR = 0,
    RADIAL = 1,
};
@ccclass('YJGradientColor')
/**
 * 渐变颜色组件，用于创建Canvas的渐变填充样式
 * @example
 * // 在属性面板设置：
 * // gradientColor: [颜色1, 颜色2, 颜色3]
 * // gradientType: LINEAR 或 RADIAL
 * 
 * // 代码中使用示例：
 * const gradient = this.getComponent(YJGradientColor).createGradient(ctx, {
 *   x: 0, 
 *   y: 0,
 *   width: 200,
 *   height: 100
 * });
 * ctx.fillStyle = gradient;
 * ctx.fillRect(0, 0, 200, 100);
 */
export class YJGradientColor extends Component {
    /**
     * 渐变颜色数组，至少需要2个颜色
     * @example 
     * // 创建红到蓝的渐变
     * [color(255,0,0), color(0,0,255)]
     * 
     * // 创建彩虹色渐变
     * [color(255,0,0), color(255,165,0), color(255,255,0), 
     *  color(0,128,0), color(0,0,255), color(75,0,130)]
     */
    @property({ type: Color, displayName: '渐变颜色' })
    gradientColor: Color[] = [];

    /**
     * 渐变类型选择
     * - LINEAR: 线性渐变（默认）
     * - RADIAL: 径向渐变
     */
    @property({ type: Enum(GradientType), displayName: '渐变类型' })
    gradientType: GradientType = GradientType.LINEAR;

    /**
     * 创建Canvas渐变对象
     * @param ctx Canvas渲染上下文 
     * @param rect 渐变区域定义 {x, y, width, height}
     * @returns 配置好的CanvasGradient对象
     * 
     * @description 渐变参数说明：
     * - 线性渐变：从矩形区域左上角(rect.x, rect.y)到右下角(rect.x + width, rect.y + height)
     * - 径向渐变：以矩形中心为圆心，最大半径为宽度的一半，形成圆形渐变
     */
    public createGradient(ctx: CanvasRenderingContext2D, rect: { x: number, y: number, width: number, height: number }) {
        let grd: CanvasGradient;
        
        // 根据渐变类型创建基础渐变
        if (this.gradientType == GradientType.LINEAR) {
            // 线性渐变：从左上到右下
            grd = ctx.createLinearGradient(
                rect.x, 
                rect.y, 
                rect.x + rect.width, 
                rect.y + rect.height
            );
        } else {
            // 径向渐变：以区域中心为圆心，半径从0到宽度一半
            const centerX = rect.x + rect.width / 2;
            const centerY = rect.y + rect.height / 2;
            grd = ctx.createRadialGradient(
                centerX, centerY, 0,         // 起始圆（半径为0）
                centerX, centerY, rect.width / 2  // 结束圆（最大半径）
            );
        }

        // 添加颜色停止点（均匀分布）
        const colorCount = this.gradientColor.length;
        for (let i = 0; i < colorCount; i++) {
            // 计算颜色位置（0到1之间）
            const stop = i / (colorCount - 1);
            grd.addColorStop(stop, this.gradientColor[i].toCSS());
        }

        return grd;
    }
}