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
    protected _path: { u: number, v: number }[] = [];
    protected _pathPoints: { idx: number, r: number, g: number, b: number, a: number }[] = [];
    protected _dir4 = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

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
        this.scanWholePath();
    }

    /**
     * 扫描整个路径
     */
    protected scanWholePath() {
        this._path.length = 0;
        let len = 0;
        for (let x1 = 0; x1 < this._size.width; x1 += this.step) {
            for (let y1 = 0; y1 < this._size.height; y1++) {
                if (this.isPath(x1, y1)) {
                    this._path[len++] = { u: x1, v: y1 };
                    break;
                }
            }
        }
        this.showPoints(this._path);
        this.updateToData();
    }

    /**
     * 扫描指定区域路径
     * @param u 区域X坐标
     * @param v 区域Y坐标
     * @param width 区域宽度
     * @param height 区域高度
     */
    protected scanAreaPath(u: number, v: number, radius: number) {
        let idx = 0;
        const endU = u + radius * 2,
            endV = v + radius * 2;
        for (let i = this._path.length - 1; i >= 0; i--) {
            const p = this._path[i];
            if (p.u > u && p.u < endU && p.v > v && p.v < endV) {
                this._path.splice(i, 1);
                idx = i;
            }
        }
        const centerU = u + radius,
            centerV = v + radius;
        const startPoints = this.getStartEndPoints(centerU, centerV, radius);
        if (startPoints.length < 2) return;
        const step = this.step;
        const path: { u: number, v: number, angle: number }[] = [];
        // this._path.splice(idx++, 0, { u: startPoints[0].u, v: startPoints[0].v }, { u: startPoints[1].u, v: startPoints[1].v });
        let len = 0, tempY: number;
        for (let u1 = u; u1 <= endU; u1 += step) {
            tempY = null;
            //只扫描下半部分
            for (let v1 = v + radius; v1 <= endV; v1++) {
                if (this.isPath(u1, v1)) {
                    if (tempY == null || v1 - tempY >= 10) tempY = v1;
                    else continue;
                    const angle = -no.angleTo({ x: centerU, y: centerV }, { x: u1, y: v1 }).angle;
                    // if (angle > 180) {
                    //     console.error(centerU, centerV, u1, v1, angle);
                    //     continue;
                    // }
                    path[len++] = { u: u1, v: v1, angle };
                    // console.error(centerU, centerV, u1, v1, angle);
                }
            }
        }
        no.sortArray(path, (a, b) => {
            return a.angle - b.angle;
        });
        if (path[0].u != startPoints[0].u) {
            path.unshift({ u: startPoints[0].u, v: startPoints[0].v, angle: 0 });
        }
        if (path[path.length - 1].u != startPoints[1].x) {
            path.push({ u: startPoints[1].u, v: startPoints[1].v, angle: 0 });
        }
        path.forEach(p => this._path.splice(idx++, 0, p));

        //去重
        for (let i = this._path.length - 1; i >= 1; i--) {
            const x = this._path[i].u - this._path[i - 1].u;
            const y = this._path[i].v - this._path[i - 1].v;
            if (x > -5 && x < 5 && y > -5 && y < 5) {
                this._path.splice(i, 1);
            }
        }
        this.showPoints(this._path);
        this.updateToData();
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
     * 获取贝塞尔曲线起点和终点, 
     * @param u 挖洞中心X坐标
     * @param v 挖洞中心Y坐标
     * @param radius 挖洞半径
     */
    protected getStartEndPoints(u: number, v: number, radius: number): { x: number, y: number, u: number, v: number }[] {
        const points = [];
        const minX = u - radius;
        const maxX = u + radius;
        const minY = v - radius;
        const maxY = v + radius;
        let b: boolean;
        for (let i = minX; i <= maxX; i++) {
            const a = this.isPixelAlpha0(i, minY);
            if (i == minX) b = a;
            else if (b != a) {
                points.push({ x: i, y: minY, u: i, v: minY });
                break;
            }
        }
        for (let i = minX; i <= maxX; i++) {
            const a = this.isPixelAlpha0(i, maxY);
            if (i == minX) b = a;
            else if (b != a) {
                points.push({ x: i, y: maxY, u: i, v: maxY });
                break;
            }
        }
        if (points.length < 2) {
            for (let i = minY; i <= maxY; i++) {
                const a = this.isPixelAlpha0(minX, i);
                if (i == minY) b = a;
                else if (b != a) {
                    points.push({ x: minX, y: i, u: minX, v: i });
                    break;
                }
            }
        }
        if (points.length < 2) {
            for (let i = minY; i <= maxY; i++) {
                const a = this.isPixelAlpha0(maxX, i);
                if (i == minY) b = a;
                else if (b != a) {
                    points.push({ x: maxX, y: i, u: maxX, v: i });
                    break;
                }
            }
        }
        return points;
    }

    /**
     * 更新数据到dataWork
     */
    protected updateToData() {
        const path: { x: number, y: number }[] = [];
        for (let i = 0, n = this._path.length; i < n; i++) {
            const p = this._path[i];
            const [x, y] = this.uvToXy(p.u, p.v);
            path.push({ x, y });
        }
        this.setDataValue('scanPath', path);
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
        return this._textureBuffer[u] === 0;
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

    /**
     * 显示点, 用于调试
     * @param points 点
     */
    protected showPoints(points: { u: number, v: number }[]) {
        if (!this.showPathPoints) return;
        this._pathPoints.length = 0;
        let i = 0;
        const r = Math.random() * 255,
            g = Math.random() * 255,
            b = Math.random() * 255;
        no.schedule(() => {
            const p = points[i++];
            if (!p) return;
            for (let i = p.u - 3; i <= p.u + 3; i++) {
                for (let j = p.v - 3; j <= p.v + 3; j++) {
                    const idx = this.uvToPixelIndex(i, j);
                    if (this._textureBuffer[idx] == null) {
                        // console.error('showPoints null', i, j, idx);
                        continue;
                    }
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
     * 获取像素索引
     * @param u 像素X坐标
     * @param v 像素Y坐标
     * @returns 像素索引
     */
    private uvToPixelIndex(u: number, v: number) {
        return (v * this._size.width + u) * 4;
    }

    /**
     * 坐标转换：世界坐标 -> 纹理坐标
     * @param x 世界X坐标
     * @param y 世界Y坐标
     * @returns [u, v] 纹理坐标
     * 
     * @description 转换规则：
     * 1. X轴：世界坐标 + 地图半宽 = 纹理X坐标
     * 2. Y轴：地图高度 - (世界坐标 + 地图半高) = 纹理Y坐标
     * 3. 坐标范围限制在[0, 地图尺寸-1]
     */
    protected xyToUv(x: number, y: number) {
        const pos = this.node.position;
        // 计算相对于地图左下角的位置
        const relativeX = x + this._size.width / 2;
        // 注意：这里Y坐标需要翻转，因为纹理坐标系原点在左上角
        const relativeY = this._size.height - (y + this._size.height / 2);

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
        const pos = this.node.position;
        // 计算相对于地图左下角的位置
        const relativeX = u - this._size.width / 2;
        // 注意：这里Y坐标需要翻转，因为纹理坐标系原点在左上角
        const relativeY = this._size.height / 2 - v;
        return [
            relativeX - pos.x,
            relativeY - pos.y
        ];
    }
}

