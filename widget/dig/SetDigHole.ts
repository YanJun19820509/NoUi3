import { no } from '../../no';
import { ccclass, requireComponent, Sprite, v3, Vec3 } from '../../yj';
import { SetScanPath } from '../scanPath/SetScanPath';
/**
 * 挖洞效果组件
 * 图片路径，挖洞信息{节点内坐标，半径，弧度}
 * data:{path: string, digInfo:{x: number, y: number, radius: number, radian: number}}
 */
@ccclass('SetDigHole')
@requireComponent([Sprite])
export class SetDigHole extends SetScanPath {

    private _tempPos: Vec3 = v3();
    private _isDig = false;
    private _drawLineUv: Set<string> = new Set();
    private _drawOutlineUv: Set<string> = new Set();
    private _holesInfo: any[] = [];

    protected onDataChange(data: any): void {
        const { path, digInfo, oldDigInfo } = data;
        if (path) {
            super.onDataChange(path);
            this.clearDataValue(`${this.bind_keys}.path`);
            this._holesInfo.length = 0;
        }
        if (digInfo) {
            this._tempPos.set(digInfo.x, digInfo.y, 0);
            no.worldPositionInNode(this._tempPos, this.node, this._tempPos);
            this._holesInfo.push({ x: this._tempPos.x, y: this._tempPos.y, radius: digInfo.radius });
            this.digHole(this._tempPos.x, this._tempPos.y, digInfo.radius);
            // this.digEllipseHole(this._tempPos.x, this._tempPos.y, info.radius, info.radian);
            this.clearDataValue(`${this.bind_keys}.digInfo`);
        }
        //恢复旧挖洞
        if (oldDigInfo) {
            const infos = [].concat(oldDigInfo);
            this.recoverHoles(infos);
            this.clearDataValue(`${this.bind_keys}.oldDigInfo`);
        }
    }

    /**
     * 恢复旧挖洞
     * @param infos 挖洞信息
     */
    private recoverHoles(infos: any[]) {
        if (!this._pathReady) {
            this.scheduleOnce(() => {
                this.recoverHoles(infos);
            }, 0);
            return;
        }
        for (let i = 0, n = infos.length; i < n; i++) {
            const info = infos[i];
            this._tempPos.set(info.x, info.y, 0);
            this._holesInfo.push({ x: this._tempPos.x, y: this._tempPos.y, radius: info.radius });
            this.digHole(this._tempPos.x, this._tempPos.y, info.radius);
            // this.digEllipseHole(this._tempPos.x, this._tempPos.y, info.radius, info.radian);
        }
        this.updateScanState();
    }

    /**
     * 挖圆洞
     * @param x 挖洞中心X坐标
     * @param y 挖洞中心Y坐标
     * @param radius 挖洞半径
     * @param radian 挖洞方向
     */
    private digHole(x: number, y: number, radius: number) {
        this._isDig = true;
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
                if (this.isInCircle(x, y, centerX, centerY, radius))
                    this.setPixelAlpha(x, y);
            }
        }
    }

    /**
     * 挖椭圆洞
     * @param x 挖洞中心X坐标
     * @param y 挖洞中心Y坐标
     * @param radius 挖洞半径
     * @param radian 挖洞方向
     */
    private digEllipseHole(x: number, y: number, radius: number, radian?: number) {
        this._isDig = true;
        this.clearPoints();
        const [centerX, centerY] = this.xyToUv(x, y);
        const a = radius,
            b = radius * .5;
        if (radian) {
            const rotatedPoints: { x: number, y: number }[] = [];
            for (let i = -1; i <= 1; i += 2) {
                for (let j = -1; j <= 1; j += 2) {
                    rotatedPoints.push(no.rotatePointByCenter({ x: centerX + i * a, y: centerY + j * b }, { x: centerX, y: centerY }, radian));
                }
            }
            const startX = Math.max(Math.min(...rotatedPoints.map(p => p.x)), 0);
            const endX = Math.min(Math.max(...rotatedPoints.map(p => p.x)), this._size.width - 1);
            const startY = Math.max(Math.min(...rotatedPoints.map(p => p.y)), 0);
            const endY = Math.min(Math.max(...rotatedPoints.map(p => p.y)), this._size.height - 1);
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    if (this.isInEllipse(x, y, centerX, centerY, a, b, -radian))
                        this.setPixelAlpha(x, y);
                }
            }
        } else {
            // 计算更新区域边界（优化性能，只处理视野范围内像素）
            const startX = Math.max(0, centerX - a + 1);
            const endX = Math.min(this._size.width - 1, centerX + a - 1);
            const startY = Math.max(0, centerY - b + 1);
            const endY = Math.min(this._size.height - 1, centerY + b - 1);

            // 遍历区域内的每个像素
            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    if (this.isInEllipse(x, y, centerX, centerY, a, b, radian))
                        this.setPixelAlpha(x, y);
                }
            }
        }
    }

    /**
     * 判断点是否在圆内
     * @param x 点X坐标
     * @param y 点Y坐标
     * @param centerX 圆心X坐标
     * @param centerY 圆心Y坐标
     * @param radius 圆半径
     * @returns 是否在圆内
     */
    private isInCircle(x: number, y: number, centerX: number, centerY: number, radius: number) {
        const dx = x - centerX;
        const dy = y - centerY;
        return dx * dx + dy * dy <= radius * radius;
    }

    /**
     * 判断点是否在椭圆内
     * @param x 点X坐标
     * @param y 点Y坐标
     * @param centerX 椭圆中心X坐标
     * @param centerY 椭圆中心Y坐标
     * @param radiusX 椭圆X半径
     * @param radiusY 椭圆Y半径
     * @param radian 椭圆旋转角度
     * @returns 是否在椭圆内
     */
    private isInEllipse(x: number, y: number, centerX: number, centerY: number, radiusX: number, radiusY: number, radian: number) {
        // // 平移点，使椭圆中心为原点
        const translatedX = x - centerX;
        const translatedY = y - centerY;

        // // 旋转点的坐标
        const rotated = no.rotatePoint({ x: translatedX, y: translatedY }, radian);
        // // 应用椭圆方程
        const a = rotated.x / radiusX;
        const b = rotated.y / radiusY;
        return a * a + b * b <= 1;
    }

    /**
     * 获取所有边缘像素时回调
     * @param arr 像素
     */
    protected onGetWholePixels() {
        this.drawOutline();
        this.updateScanState();
    }

    // /**
    //  * 贝塞尔曲线挖洞
    //  * @param x 挖洞中心X坐标
    //  * @param y 挖洞中心Y坐标
    //  * @param radius 挖洞半径
    //  * @param radian 挖洞弧度
    //  */
    // private digHoleByBezier(x: number, y: number, radius: number, radian: number) {
    //     const [centerX, centerY] = this.xyToUv(x, y);
    //     const [startPoint, endPoint] = this.getStartEndPoints(centerX, centerY, radius, no.radianToAngle(radian));
    //     if (!startPoint || !endPoint) return;
    //     // const controlPoint = this.getBezierControlPoint(centerX, centerY, radius, radian);
    //     const points = no.bezierPoints([startPoint, endPoint], 20);
    //     // 查看贝塞尔曲线
    //     // this.showPoints(points);
    //     for (let i = 1; i < points.length; i++) {
    //         this.digTriangleHole({ x: centerX, y: centerY }, points[i - 1], points[i]);
    //     }
    //     let idx = 0;
    //     const startU = points[0].x,
    //         startV = points[0].y,
    //         endU = points[points.length - 1].x,
    //         endV = points[points.length - 1].y;
    //     for (let i = this._path.length - 1; i >= 0; i--) {
    //         const p = this._path[i];
    //         if (p.u > startU && p.u < endU && p.v > startV && p.v < endV) {
    //             this._path.splice(i, 1);
    //             idx = i;
    //         }
    //     }
    //     points.forEach(p => this._path.splice(idx++, 0, { u: p.x, v: p.y }));
    //     this.showPoints(this._path);
    //     this.updateToData();
    // }

    // /**
    //  * 获取贝塞尔曲线控制点
    //  * @param u 挖洞中心X坐标
    //  * @param v 挖洞中心Y坐标
    //  * @param radius 挖洞半径
    //  * @param radian 挖洞弧度
    //  * @returns 控制点
    //  */
    // private getBezierControlPoint(u: number, v: number, radius: number, radian: number): { x: number, y: number } {
    //     return { x: Math.floor(u + radius * Math.cos(radian)), y: Math.floor(v - radius * Math.sin(radian)) };
    // }

    // /**
    //  * 挖三角形洞
    //  * @param p1 三角形顶点1
    //  * @param p2 三角形顶点2
    //  * @param p3 三角形顶点3
    //  */
    // private digTriangleHole(p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }) {
    //     const startX = Math.min(p1.x, p2.x, p3.x);
    //     const startY = Math.min(p1.y, p2.y, p3.y);
    //     const endX = Math.max(p1.x, p2.x, p3.x);
    //     const endY = Math.max(p1.y, p2.y, p3.y);
    //     // 遍历区域内的每个像素
    //     for (let y = startY; y <= endY; y++) {
    //         for (let x = startX; x <= endX; x++) {
    //             if (!no.isPointInTriangle({ x, y }, p1, p2, p3)) continue;

    //             this.setPixelAlpha(x, y);
    //         }
    //     }
    // }

    /**
     * 设置像素透明度
     * @param u 像素X坐标
     * @param v 像素Y坐标
     * @param alpha 透明度
     */
    private setPixelAlpha(u: number, v: number, alpha = 0) {
        const i = this.alphaIndex(u, v);
        if (this._textureBuffer[i] != null) {
            this._textureBuffer[i] = alpha;
            this.deleteFromNoAlpha0Pixels(u, v);
        } else {
            console.error('setPixelAlpha null', u, v);
        }
    }

    /**
     * 绘制轮廓
     * @param arr 轮廓点
     */
    private drawOutline() {
        for (let k = 0, n = this._pixelArr.length; k < n; k++) {
            const [u, v] = this._pixelArr[k];
            // for (let i = u - 3, m = u + 3; i <= m; i++) {
            //     for (let j = v - 3, m = v + 3; j <= m; j++) {
            //         if (this.isPixelAlpha0(i, j)) continue;
            if (this._drawOutlineUv.has(`${u},${v}`)) continue;
            this._drawOutlineUv.add(`${u},${v}`);
            const idx = this.uvToPixelIndex(u, v);
            this._textureBuffer[idx] = 0;
            this._textureBuffer[idx + 1] = 0;
            this._textureBuffer[idx + 2] = 0;
            this._textureBuffer[idx + 3] = 2;
            this.drawRandomLine(u, v);
            // }
            // }
        }
    }

    /**
     * 绘制随机线
     * @param u 起点X坐标
     * @param v 起点Y坐标
     */
    private drawRandomLine(u: number, v: number) {
        if (!this._isDig) {
            this._drawLineUv.add(`${u},${v}`);
            return;
        }
        if (this._drawLineUv.has(`${u},${v}`)) return;
        this._drawLineUv.add(`${u},${v}`);
        if (Math.random() > .9) return;
        const angle = Math.random() * Math.PI * 2;
        const length = Math.random() * 10 + 10;
        const startX = Math.floor(u + Math.cos(angle) * length);
        const startY = Math.floor(v + Math.sin(angle) * length);
        const endX = Math.floor(u - Math.cos(angle) * length);
        const endY = Math.floor(v - Math.sin(angle) * length);
        this.drawLine(startX, startY, endX, endY);
    }

    private drawLine(u1: number, v1: number, u2: number, v2: number) {
        const dy = (v2 - v1) / (u2 - u1);
        for (let u = u1; u <= u2; u++) {
            const v = v1 + Math.floor(dy * (u - u1));
            const idx = this.uvToPixelIndex(u, v);
            if (!this._textureBuffer[idx + 3]) continue;
            this._textureBuffer[idx] = 0;
            this._textureBuffer[idx + 1] = 0;
            this._textureBuffer[idx + 2] = 0;
            this._textureBuffer[idx + 3] = 255;
        }
    }

    protected updateToData() {
        super.updateToData();
        //保存挖洞信息
        this.clearDataValue('holesInfo');
        this.setDataValue('holesInfo', this._holesInfo);
    }
}

