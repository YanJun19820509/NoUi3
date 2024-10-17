import { ccclass, color, Color, Component, Enum, property } from "NoUi3/yj";
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
export class YJGradientColor extends Component {
    @property({ type: Color, displayName: '渐变颜色' })
    gradientColor: Color[] = [];

    @property({ type: Enum(GradientType), displayName: '渐变类型' })
    gradientType: GradientType = GradientType.LINEAR;

    public createGradient(ctx: CanvasRenderingContext2D, rect: { x: number, y: number, width: number, height: number }) {
        let grd: CanvasGradient;
        if (this.gradientType == GradientType.LINEAR) {
            grd = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
        } else {
            grd = ctx.createRadialGradient(rect.x + rect.width / 2, rect.y + rect.height / 2, 0, rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2);
        }
        for (let i = 0; i < this.gradientColor.length; i++) {
            grd.addColorStop(i / (this.gradientColor.length - 1), this.gradientColor[i].toCSS());
        }
        return grd;
    }
}