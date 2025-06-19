import { no } from '../../no';
import { ccclass, requireComponent, Sprite } from '../../yj';
import { SetScanPath } from '../scanPath/SetScanPath';
/**
 * 挖洞效果组件
 * 图片路径，挖洞信息{节点内坐标，半径，弧度}
 * data:{path: string, digInfo:{x: number, y: number, radius: number, radian: number}}
 */
@ccclass('SetDigHole')
@requireComponent([Sprite])
export class SetDigHole extends SetScanPath {

    protected onDataChange(data: any): void {
        const { path, digInfo } = data;
        if (path) {
            super.onDataChange(path);
            this.clearDataValue(`${this.bind_keys}.path`);
        }
        if (digInfo) {
            this.digHole(digInfo.x, digInfo.y, digInfo.radius);
            // this.digHoleByBezier(digInfo.x, digInfo.y, digInfo.radius, digInfo.radian);
            this.clearDataValue(`${this.bind_keys}.digInfo`);
        }
    }

    /**
     * 挖洞
     * @param x 挖洞中心X坐标
     * @param y 挖洞中心Y坐标
     * @param radius 挖洞半径
     */
    private digHole(x: number, y: number, radius: number) {
        this.clearPoints();
        const [centerX, centerY] = this.xyToUv(x, y);
        // 计算更新区域边界（优化性能，只处理视野范围内像素）
        const startX = Math.max(0, centerX - radius + 1);
        const endX = Math.min(this._size.width - 1, centerX + radius - 1);
        const startY = Math.max(0, centerY - radius + 1);
        const endY = Math.min(this._size.height - 1, centerY + radius - 1);

        // 遍历区域内的每个像素
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                // 计算像素到中心的距离
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > radius) continue;

                this.setPixelAlpha(x, y);
            }
        }

        // 提交纹理更新
        this._updateTexture();
        this.scanAreaPath(startX - 1, startY - 1, radius);
    }

    /**
     * 贝塞尔曲线挖洞
     * @param x 挖洞中心X坐标
     * @param y 挖洞中心Y坐标
     * @param radius 挖洞半径
     * @param radian 挖洞弧度
     */
    private digHoleByBezier(x: number, y: number, radius: number, radian: number) {
        const [centerX, centerY] = this.xyToUv(x, y);
        const [startPoint, endPoint] = this.getStartEndPoints(centerX, centerY, radius);
        if (!startPoint || !endPoint) return;
        const controlPoint = this.getBezierControlPoint(centerX, centerY, radius * 3, radian);
        const points = no.bezierPoints([startPoint, controlPoint, endPoint], 5);
        // 查看贝塞尔曲线
        // this.showPoints(points);
        for (let i = 1; i < points.length; i++) {
            this.digTriangleHole({ x: centerX, y: centerY }, points[i - 1], points[i]);
        }
        this._updateTexture();
    }

    /**
     * 获取贝塞尔曲线控制点
     * @param u 挖洞中心X坐标
     * @param v 挖洞中心Y坐标
     * @param radius 挖洞半径
     * @param radian 挖洞弧度
     * @returns 控制点
     */
    private getBezierControlPoint(u: number, v: number, radius: number, radian: number): { x: number, y: number } {
        return { x: Math.floor(u + radius * Math.cos(radian)), y: Math.floor(v - radius * Math.sin(radian)) };
    }

    /**
     * 挖三角形洞
     * @param p1 三角形顶点1
     * @param p2 三角形顶点2
     * @param p3 三角形顶点3
     */
    private digTriangleHole(p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }) {
        const startX = Math.min(p1.x, p2.x, p3.x);
        const startY = Math.min(p1.y, p2.y, p3.y);
        const endX = Math.max(p1.x, p2.x, p3.x);
        const endY = Math.max(p1.y, p2.y, p3.y);
        // 遍历区域内的每个像素
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (!no.isPointInTriangle({ x, y }, p1, p2, p3)) continue;

                this.setPixelAlpha(x, y);
            }
        }
    }

    /**
     * 设置像素透明度
     * @param u 像素X坐标
     * @param v 像素Y坐标
     * @param alpha 透明度
     */
    private setPixelAlpha(u: number, v: number, alpha = 0) {
        const i = this.alphaIndex(u, v);
        if (this._textureBuffer[i] != null)
            this._textureBuffer[i] = alpha;
        else {
            console.error('setPixelAlpha null', u, v);
        }
    }
}

