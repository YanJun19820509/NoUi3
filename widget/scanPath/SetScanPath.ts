import { DynamicAtlasTexture } from '../../engine/atlas';
import { no } from '../../no';
import { HackUi } from '../../ui/HackUi';
import { ccclass, property, Rect, requireComponent, Sprite, SpriteFrame, Texture2D } from '../../yj';

/**
 * 扫描路径组件，扫描图片透明交界处，生成路径
 * 图片路径
 * data: string
 * 路径数据生成后，会自动更新到dataWork的scanPath中
 */
@ccclass('SetScanPath')
@requireComponent([Sprite])
export class SetScanPath extends HackUi {
    @property({ displayName: '步长' })
    step = 10;
    @property({ displayName: '开启调试' })
    showPathPoints = false;
    @property({ displayName: '显示路径点时间间隔', min: 0, visible() { return this.showPathPoints } })
    interval = .1;

    protected _sprite: Sprite = null!;
    protected _spriteFrame: SpriteFrame;
    protected _texture: DynamicAtlasTexture = null!; // 动态纹理对象
    protected _textureBuffer: Uint8Array = null!; // 纹理数据缓冲区（RGBA格式）
    protected _size: { width: number, height: number };
    protected _pathes: { u: number, v: number }[][] = [];
    protected _pathPoints: { idx: number, r: number, g: number, b: number, a: number }[] = [];
    //上右下左
    protected _dir4 = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
    //上、右上、右、右下、下、左下、左、左上
    protected _dir8 = [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 }];

    protected onDestroy(): void {
        this._spriteFrame?.destroy();
        this._spriteFrame = null;
        this._sprite = null;
        this._texture?.destroy();
        this._texture = null;
        this._textureBuffer = null;
        this._size = null;
    }

    protected onDataChange(data: any): void {
        const path = data;
        no.assetBundleManager.loadTexture(path + '/texture', t => {
            this.init(t);
        });
    }


    /**
     * 初始化纹理
     * @param texture 纹理
     */
    protected init(texture: Texture2D) {
        this._size = { width: texture.width, height: texture.height };
        this._texture?.destroy();
        this._texture = new DynamicAtlasTexture();
        this._texture.initWithSize(this._size.width, this._size.height);
        this._textureBuffer = this._texture.getTextureBuffer(texture, new Rect(0, 0, this._size.width, this._size.height));
        this._texture.uploadData(this._textureBuffer);
        if (!this._sprite) this._sprite = this.getComponent(Sprite);
        this._spriteFrame?.destroy();
        this._spriteFrame = new SpriteFrame();
        this._spriteFrame.texture = this._texture;
        this._sprite.spriteFrame = this._spriteFrame;
        texture.decRef();
        // this.scanWholePath();
        // this.scanWholePathByPixel();
        this.scanWholePixels();
    }

    // /**
    //  * 扫描整个路径
    //  */
    // protected scanWholePath() {
    //     this._pathes.length = 0;
    //     let len = 0;
    //     for (let x1 = 0; x1 < this._size.width; x1 += this.step) {
    //         for (let y1 = 0; y1 < this._size.height; y1++) {
    //             if (this.isPath(x1, y1)) {
    //                 this._pathes[len++] = { u: x1, v: y1 };
    //                 break;
    //             }
    //         }
    //     }
    //     this.showPath(this._pathes);
    //     this.updateToData();
    // }

    // /**
    //  * 扫描指定区域路径
    //  * @param u 区域X坐标
    //  * @param v 区域Y坐标
    //  * @param width 区域宽度
    //  * @param height 区域高度
    //  * @param angle 区域方向
    //  */
    // protected scanAreaPath(u: number, v: number, radius: number, angle: number) {
    //     let idx = 0;
    //     const endU = u + radius * 2,
    //         endV = v + radius * 2;
    //     for (let i = this._pathes.length - 1; i >= 0; i--) {
    //         const p = this._pathes[i];
    //         if (p.u > u && p.u < endU && p.v > v && p.v < endV) {
    //             this._pathes.splice(i, 1);
    //             idx = i;
    //         }
    //     }
    //     const centerU = u + radius,
    //         centerV = v + radius;
    //     const startPoints = this.getStartEndPoints(centerU, centerV, radius, angle);
    //     if (startPoints.length < 2) return;
    //     const step = 10;
    //     const path: { u: number, v: number, angle: number }[] = [];
    //     let len = 0, tempY: number, angleMax: number;
    //     for (let u1 = u; u1 <= endU; u1 += step) {
    //         tempY = null;
    //         for (let v1 = v; v1 < endV; v1++) {
    //             if (this.isPath(u1, v1)) {
    //                 // if (tempY == null || v1 - tempY >= 10) tempY = v1;
    //                 // else continue;
    //                 const distance = no.distance({ x: u1, y: v1 }, { x: centerU, y: centerV });
    //                 if (distance > radius + 3) continue;
    //                 let a = this.angleTo(centerU, centerV, u1, v1);
    //                 if (a == 0) {
    //                     if (u1 < centerU) a = 180;
    //                     else a = 360;
    //                 }
    //                 if (angleMax == null || a > angleMax) angleMax = a;
    //                 else if (angleMax > 270 && a < 180) a += 360;
    //                 path[len++] = { u: u1, v: v1, angle: a };
    //             }
    //         }
    //     }
    //     this.sortPoints(path, angle);
    //     // if (path[0].u != startPoints[0].u || path[0].u != startPoints[1].u) {
    //     //     path.unshift({ u: startPoints[0].u, v: startPoints[0].v, angle: 0 });
    //     // }
    //     // if (path[path.length - 1].u != startPoints[1].u || path[path.length - 1].u != startPoints[0].u) {
    //     //     path.push({ u: startPoints[1].u, v: startPoints[1].v, angle: 0 });
    //     // }
    //     path.forEach(p => this._pathes.splice(idx++, 0, p));

    //     //去重
    //     const step1 = step / 2;
    //     for (let i = this._pathes.length - 1; i >= 1; i--) {
    //         const x = this._pathes[i].u - this._pathes[i - 1].u;
    //         const y = this._pathes[i].v - this._pathes[i - 1].v;
    //         if (x > -step1 && x < step1 && y > -step1 && y < step1) {
    //             this._pathes.splice(i, 1);
    //         }
    //     }
    //     this.showPoints(this._pathes);
    //     this.updateToData();
    // }

    // /**
    //  * 获取贝塞尔曲线起点和终点, 
    //  * @param u 挖洞中心X坐标
    //  * @param v 挖洞中心Y坐标
    //  * @param radius 挖洞半径
    //  */
    // protected getStartEndPoints(u: number, v: number, radius: number, middleAngle: number): { x: number, y: number, u: number, v: number, angle: number }[] {
    //     const points = [];
    //     const minX = u - radius;
    //     const maxX = u + radius;
    //     const minY = v - radius;
    //     const maxY = v + radius;
    //     let b: boolean;
    //     for (let i = minX; i <= maxX; i++) {
    //         const a = this.isPixelAlpha0(i, minY);
    //         if (i == minX) b = a;
    //         else if (b != a) {
    //             const angle = this.angleTo(u, v, i, minY);
    //             points.push({ x: i, y: minY, u: i, v: minY, angle });
    //             break;
    //         }
    //     }
    //     for (let i = minX; i <= maxX; i++) {
    //         const a = this.isPixelAlpha0(i, maxY);
    //         if (i == minX) b = a;
    //         else if (b != a) {
    //             const angle = this.angleTo(u, v, i, maxY);
    //             points.push({ x: i, y: maxY, u: i, v: maxY, angle });
    //             break;
    //         }
    //     }
    //     if (points.length < 2) {
    //         for (let i = minY; i <= maxY; i++) {
    //             const a = this.isPixelAlpha0(minX, i);
    //             if (i == minY) b = a;
    //             else if (b != a) {
    //                 const angle = this.angleTo(u, v, minX, i);
    //                 points.push({ x: minX, y: i, u: minX, v: i, angle });
    //                 break;
    //             }
    //         }
    //     }
    //     if (points.length < 2) {
    //         for (let i = minY; i <= maxY; i++) {
    //             const a = this.isPixelAlpha0(maxX, i);
    //             if (i == minY) b = a;
    //             else if (b != a) {
    //                 const angle = this.angleTo(u, v, maxX, i);
    //                 points.push({ x: maxX, y: i, u: maxX, v: i, angle });
    //                 break;
    //             }
    //         }
    //     }
    //     if (points.length == 2) {
    //         //判断起点和终点
    //         const minAngle = middleAngle - 90;
    //         const maxAngle = middleAngle + 90;
    //         for (let i = 0; i < 2; i++) {
    //             const { angle } = points[i];
    //             //起点
    //             if (angle > minAngle && angle < middleAngle) {
    //                 if (i == 1) {
    //                     const t = points[0];
    //                     points[0] = points[1];
    //                     points[1] = t;
    //                 }
    //                 break;
    //             }
    //             //终点
    //             else if (angle > middleAngle && angle < maxAngle) {
    //                 if (i == 0) {
    //                     const t = points[0];
    //                     points[0] = points[1];
    //                     points[1] = t;
    //                 }
    //                 break;
    //             }
    //         }
    //     }
    //     return points;
    // }

    // /**
    //  * 排序点,角度范围为[0,360]，
    //  * @param points 点
    //  * @param middleAngle 中间角度
    //  */
    // protected sortPoints(points: { u: number, v: number, angle: number }[], middleAngle: number) {
    //     if (middleAngle <= 90 || middleAngle >= 270) {
    //         for (let i = 0, n = points.length; i < n; i++) {
    //             const p = points[i];
    //             if (p.angle <= 90) {
    //                 p.angle += 360;
    //             }
    //         }
    //     }
    //     no.sortArray(points, (a, b) => {
    //         return a.angle - b.angle;
    //     });
    // }

    // /**
    //  * 像素扫描路径
    //  */
    // protected scanWholePathByPixel() {
    //     this._pathes.length = 0;
    //     const tempPath: string[] = [];
    //     let len = 0;
    //     for (let x1 = 0; x1 < this._size.width; x1++) {
    //         if (len > 0) break;
    //         for (let y1 = 0; y1 < this._size.height; y1++) {
    //             if (this.isPath(x1, y1)) {
    //                 this._pathes[len++] = { u: x1, v: y1 };
    //                 tempPath.push(`${x1}-${y1}`);
    //                 break;
    //             }
    //         }
    //     }
    //     let curP = this._pathes[0];
    //     let n = this.step;
    //     while (curP.u + 1 < this._size.width) {
    //         for (let i = 0; i < 8; i++) {
    //             const d = this._dir8[i];
    //             const p = { u: curP.u + d.x, v: curP.v + d.y };
    //             if (tempPath.includes(`${p.u}-${p.v}`)) continue;
    //             if (this.isPath(p.u, p.v)) {
    //                 if (--n == 0) {
    //                     this._pathes[len++] = p;
    //                     n = this.step;
    //                 }
    //                 curP = p;
    //                 tempPath.push(`${p.u}-${p.v}`);
    //                 break;
    //             }
    //         }
    //     }
    //     this.showPoints(this._pathes);
    //     this.updateToData();
    // }

    // protected scanAreaPathByPixel(start: number, end: number) {
    //     let idx = 0;
    //     for (let i = this._pathes.length - 1; i >= 0; i--) {
    //         const p = this._pathes[i];
    //         if (p.u > start && p.u < end + 30) {
    //             this._pathes.splice(i, 1);
    //             idx = i;
    //         }
    //     }
    //     const endP = this._pathes[idx + 1];
    //     const tempPath: string[] = [];
    //     let len = 0;
    //     const path: { u: number, v: number }[] = [];
    //     let curU = this._pathes[idx - 1].u;
    //     let curV = this._pathes[idx - 1].v;
    //     let n = this.step;
    //     let set = false;
    //     while (curU != endP.u && curV != endP.v && curU < this._size.width) {
    //         set = false;
    //         for (let i = 0; i < 8; i++) {
    //             const d = this._dir8[i];
    //             const p = { u: curU + d.x, v: curV + d.y };
    //             if (tempPath.includes(`${p.u}-${p.v}`)) continue;
    //             if (this.isPath(p.u, p.v)) {
    //                 if (--n == 0) {
    //                     path[len++] = p;
    //                     n = this.step;
    //                 }
    //                 set = true;
    //                 curU = p.u;
    //                 curV = p.v;
    //                 tempPath.push(`${p.u}-${p.v}`);
    //                 break;
    //             }
    //         }
    //         if (!set) {
    //             curU += 1;
    //         }
    //     }
    //     path.forEach(p => this._pathes.splice(idx++, 0, p));
    //     this.showPoints(this._pathes);
    //     this.updateToData();
    // }

    /**
     * 扫描所有像素，找到边缘像素
     */
    protected scanWholePixels() {
        this._pathes.length = 0;
        const arr: number[][] = [];
        for (let i = 0; i < this._size.width; i++) {
            for (let j = 0; j < this._size.height; j++) {
                if (this.isPath(i, j)) {
                    arr.push([i, j]);
                }
            }
        }
        this.onGetWholePixels(arr);
        while (arr.length > 0) {
            const path = this.splitPath(arr);
            if (path.length > 1) {
                this._pathes.push(path);
            }
        }
        this.showPath(this._pathes);
        this.updateToData();
    }

    /**
     * 将边缘像素分割成路径
     * @param arr 边缘像素
     * @returns 路径
     */
    protected splitPath(arr: number[][]) {
        const path: { u: number, v: number }[] = [{ u: arr[0][0], v: arr[0][1] }];
        arr.splice(0, 1);
        let a = false;
        let n = this.step;
        let cur = path[0];
        do {
            a = false;
            for (let i = 0; i < 8; i++) {
                const d = this._dir8[i];
                const p1 = { u: cur.u + d.x, v: cur.v + d.y };
                const idx = arr.findIndex(p => p[0] == p1.u && p[1] == p1.v);
                if (idx != -1) {
                    if (--n == 0) {
                        path[path.length] = p1;
                        n = this.step;
                    }
                    arr.splice(idx, 1);
                    cur = p1;
                    a = true;
                    break;
                }
            }
        } while (a);
        return path;
    }

    protected isPath(u: number, v: number) {
        let a = this.isPixelAlpha0(u, v);
        if (a) return false;
        for (let i = 0, n = this._dir4.length; i < n; i++) {
            const d = this._dir4[i];
            if (this.isPixelAlpha0(u + d.x, v + d.y)) return true;
        }
        return false;
    }

    /**
     * 判断两个像素是否相邻
     * @param p1 像素1
     * @param p2 像素2
     * @returns 是否相邻
     */
    protected isAdjoin(p1: { u: number, v: number }, p2: { u: number, v: number }) {
        return Math.abs(p1.u - p2.u) <= 1 && Math.abs(p1.v - p2.v) <= 1;
    }

    /**
     * 更新数据到dataWork
     */
    protected updateToData() {
        const pathesData: { x: number, y: number }[][] = [];
        for (let i = 0, n = this._pathes.length; i < n; i++) {
            const path = this._pathes[i];
            const pathData: { x: number, y: number }[] = [];
            for (let j = 0, m = path.length; j < m; j++) {
                const p = path[j];
                const [x, y] = this.uvToXy(p.u, p.v);
                pathData.push({ x, y });
            }
            pathesData.push(pathData);
        }
        this.clearDataValue('scanPathes');
        this.setDataValue('scanPathes', pathesData);
    }


    /**
     * 判断像素是否透明
     * @param u 像素X坐标
     * @param v 像素Y坐标
     * @returns 是否透明
     */
    protected isPixelAlpha0(idx: number): boolean;
    protected isPixelAlpha0(u: number, v: number): boolean;
    protected isPixelAlpha0(u: number, v?: number): boolean {
        if (v != null) u = this.alphaIndex(u, v);
        return !this._textureBuffer[u];
    }

    /**
     * 获取像素透明度索引
     * @param u 像素X坐标
     * @param v 像素Y坐标
     * @returns 透明度索引
     */
    protected alphaIndex(u: number, v: number) {
        return (v * this._size.width + u) * 4 + 3;
    }

    protected showPath(path: { u: number, v: number }[][]) {
        if (!this.showPathPoints) return;
        this._pathPoints.length = 0;
        for (let i = 0, n = path.length; i < n; i++) {
            this.showPoints(path[i]);
        }
    }

    /**
     * 显示点, 用于调试
     * @param points 点
     */
    protected showPoints(points: { u: number, v: number }[]) {
        let i = 0;
        const r = Math.random() * 255,
            g = Math.random() * 255,
            b = Math.random() * 255;
        no.schedule(() => {
            const p = points[i++];
            if (!p) return;
            for (let i = p.u - 3; i <= p.u + 3; i++) {
                for (let j = p.v - 3; j <= p.v + 3; j++) {
                    if (this.isPixelAlpha0(i, j)) continue;
                    const idx = this.uvToPixelIndex(i, j);
                    this._pathPoints.push({ idx, r: this._textureBuffer[idx], g: this._textureBuffer[idx + 1], b: this._textureBuffer[idx + 2], a: this._textureBuffer[idx + 3] });
                    this._textureBuffer[idx] = r;
                    this._textureBuffer[idx + 1] = g;
                    this._textureBuffer[idx + 2] = b;
                    this._textureBuffer[idx + 3] = 255;
                }
            }
            this._updateTexture();
        }, this.interval, points.length, 0, this)
    }

    protected clearPoints() {
        if (!this.showPathPoints) return;
        if (this._pathPoints.length == 0) return;
        for (let i = 0, n = this._pathPoints.length; i < n; i++) {
            const { idx, r, g, b, a } = this._pathPoints[i];
            this._textureBuffer[idx] = r;
            this._textureBuffer[idx + 1] = g;
            this._textureBuffer[idx + 2] = b;
            this._textureBuffer[idx + 3] = a;
        }
    }

    /**
     * 提交纹理数据更新
     */
    protected _updateTexture() {
        if (this._texture) {
            // 上传新数据到GPU
            this._texture.uploadData(this._textureBuffer);

            // 强制刷新精灵渲染
            if (this._sprite) {
                this._sprite.markForUpdateRenderData();
            }
        }
    }

    /**
     * 获取两个点之间的角度
     * @param u1 圆心点1X坐标
     * @param v1 圆心点1Y坐标
     * @param u2 目标点X坐标
     * @param v2 目标点Y坐标
     */
    protected angleTo(u1: number, v1: number, u2: number, v2: number) {
        const a = no.angleTo({ x: u1, y: v1 }, { x: u2, y: v2 });
        //因为纹理坐标系原点在左上角，所以需要转换
        return 360 - a.angle;
    }

    /**
     * 获取像素索引
     * @param u 像素X坐标
     * @param v 像素Y坐标
     * @returns 像素索引
     */
    protected uvToPixelIndex(u: number, v: number) {
        return (v * this._size.width + u) * 4;
    }

    /**
     * 坐标转换：节点坐标 -> 以左上角为原点的纹理坐标
     * @param x 节点X坐标
     * @param y 节点Y坐标
     * @returns [u, v] 纹理坐标
     */
    protected xyToUv(x: number, y: number) {
        const anchor = no.anchor(this.node);
        // 计算相对于图片左上角的位置
        const relativeX = x + anchor.x * this._size.width;
        const relativeY = (1 - anchor.y) * this._size.height - y;

        // 在等大纹理中，世界坐标可以直接映射到纹理坐标
        return [
            Math.max(0, Math.min(Math.floor(relativeX), this._size.width - 1)),
            Math.max(0, Math.min(Math.floor(relativeY), this._size.height - 1))
        ];
    }

    /**
     * 纹理坐标转换：纹理坐标 -> 世界坐标
     * @param u 纹理X坐标
     * @param v 纹理Y坐标
     * @returns [x, y] 世界坐标
     */
    protected uvToXy(u: number, v: number) {
        let { x, y } = this.node.position;
        const anchor = no.anchor(this.node);
        x += (.5 - anchor.x) * this._size.width;
        y += (.5 - anchor.y) * this._size.height;
        // 计算相对于地图左上角的位置
        const relativeX = u - this._size.width / 2;
        // 注意：这里Y坐标需要翻转，因为纹理坐标系原点在左上角
        const relativeY = this._size.height / 2 - v;
        return [
            relativeX + x,
            relativeY + y
        ];
    }

    /**
     * 获取所有边缘像素时回调
     * @param arr 像素
     */
    protected onGetWholePixels(arr: number[][]) {

    }
}

