import { YJJobManager } from '../../base/YJJobManager';
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
    @property({ displayName: '同步路径数据', tooltip: '将路径数据更新到dataWork中' })
    needUpdatePathToData: boolean = true;
    @property({ displayName: '路径数据key', tooltip: '路径数据将以该key更新到dataWork中', visible() { return this.needUpdatePathToData } })
    pathKey: string = 'scanPathes';
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
    protected _pathPoints: number[] = [];
    //左上右下
    protected _dir4 = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
    //上、右上、右、右下、下、左下、左、左上
    protected _dir8 = [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }];

    // 非透明像素
    protected _noAlpha0PixelsMap: Map<string, number[]> = new Map();
    protected _noAlpha0PixelsArr: string[] = [];
    protected _pixelSet: Set<string> = new Set();
    protected _pixelArr: number[][] = [];
    /**
     * 0: 无操作
     * 1: 扫描中
     * 2: 剔除孤立像素
     * 3: 描绘边缘
     * 4: 解析路径
     * 5: 更新纹理
     */
    protected _state = 0;
    protected _doing = false;
    protected _pathReady = false;

    private _pathPointTexture: DynamicAtlasTexture;
    private _pathPointTextureBuffer: Uint8Array;
    private _pathPointSprite: Sprite;

    protected onDestroy(): void {
        this._spriteFrame?.destroy();
        this._spriteFrame = null;
        this._sprite = null;
        this._texture?.destroy();
        this._texture = null;
        this._textureBuffer = null;
        this._size = null;
        if (this._pathPointSprite) {
            this._pathPointSprite.spriteFrame = null;
            this._pathPointTexture?.destroy();
            this._pathPointTexture = null;
            this._pathPointTextureBuffer = null;
        }
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
        this.scheduleOnce(() => {
            this.initNoAlpha0Pixels();
            this.updateScanState();
            this.initDebugSprite();
        });
    }

    protected lateUpdate(dt: number): void {
        if (this._state == 0 || this._doing) return;
        this._doing = true;
        switch (this._state) {
            case 1:
                this.scanWholePixels();
                break;
            case 2:
                this.removeIsolatedPixels();
                break;
            case 3:
                this.onGetWholePixels();
                break;
            case 4:
                this.parsePath();
                break;
            case 5:
                this._updateTexture();
                this.updateScanState();
                if (!this._pathReady) {
                    this.scheduleOnce(() => {
                        this._pathReady = true;
                    }, 0.05);
                }
                break;
        }
    }

    protected initNoAlpha0Pixels() {
        this._noAlpha0PixelsMap.clear();
        this._noAlpha0PixelsArr.length = 0;
        for (let i = 0; i < this._size.width; i++) {
            for (let j = 0; j < this._size.height; j++) {
                if (this.isPixelAlpha0(i, j)) continue;
                const key = `${i}-${j}`;
                this._noAlpha0PixelsMap.set(key, [i, j]);
            }
        }
    }

    protected deleteFromNoAlpha0Pixels(u: number, v: number) {
        this._noAlpha0PixelsArr[this._noAlpha0PixelsArr.length] = `${u}-${v}`;
    }

    /**
     * 扫描所有像素，找到边缘像素
     */
    protected scanWholePixels() {
        this._pathes.length = 0;
        this._pixelSet.clear();
        this._pixelArr.length = 0;
        for (let i = 0, n = this._noAlpha0PixelsArr.length; i < n; i++) {
            const key = this._noAlpha0PixelsArr[i];
            this._noAlpha0PixelsMap.delete(key);
        }
        this._noAlpha0PixelsArr.length = 0;
        for (const [key, value] of this._noAlpha0PixelsMap) {
            if (this.isPath(value[0], value[1])) {
                this._pixelArr[this._pixelArr.length] = value;
                this._pixelSet.add(key);
            }
        }
        // console.log('scanWholePixels', this._pixelArr.length);
        this.updateScanState();
    }

    /**
     * 剔除孤立像素
     */
    protected removeIsolatedPixels() {
        let newArr: number[][] = [];

        // 检查每个像素的邻居
        for (let i = 0, n = this._pixelArr.length; i < n; i++) {
            const p = this._pixelArr[i];
            let neighborCount = 0;

            // 检查8个方向的邻居
            for (let j = 0; j < 8; j++) {
                const d = this._dir8[j];
                const neighborKey = `${p[0] + d.x}-${p[1] + d.y}`;

                if (this._noAlpha0PixelsMap.has(neighborKey)) {
                    neighborCount++;
                    // 如果已经有3个邻居，可以提前退出内层循环
                    if (neighborCount >= 3) {
                        newArr[newArr.length] = p;
                        break;
                    }
                }
            }
            //邻居至少得有3个，如果按2个邻居判定为孤立，它的下一个邻居被判定为孤立而删除后，它自己也会变成孤立
            if (neighborCount < 3) {
                this._pixelSet.delete(`${p[0]}-${p[1]}`);
            }
        }

        this._pixelArr = newArr;
        newArr = null;
        // console.log('removeIsolatedPixels', this._pixelArr.length);
        this.updateScanState();
    }

    /**
     * 解析路径
     */
    protected parsePath() {
        while (this._pixelSet.size > 2) {
            const path = this.splitPath();
            if (path.length > 1) {
                this._pathes.push(path);
            }
        }
        this.showPath(this._pathes);
        this.updateToData();
        this.updateScanState();
    }

    /**
     * 将边缘像素分割成路径
     * @param arr 边缘像素
     * @returns 路径
     */
    protected splitPath() {
        if (this._pixelSet.size === 0) return [];
        const key = this._pixelSet.values().next().value;
        const [u, v] = this._noAlpha0PixelsMap.get(key);
        const path: { u: number, v: number }[] = [{ u, v }];
        this._pixelSet.delete(key);

        let n = this.step;
        let cur = path[0];

        while (true) {
            let found = false;

            // 检查8个方向的邻居
            for (let i = 0; i < 8; i++) {
                const d = this._dir8[i];
                const p1 = { u: cur.u + d.x, v: cur.v + d.y };
                const key = `${p1.u}-${p1.v}`;

                if (this._pixelSet.has(key)) {
                    // 从Set中移除已访问的点
                    this._pixelSet.delete(key);
                    if (--n === 0) {
                        path.push(p1);
                        n = this.step;
                    }

                    cur = p1;
                    found = true;
                    break;
                }
            }

            if (!found) break;
        }

        return path;
    }

    protected isPath(u: number, v: number) {
        for (let i = 0; i < 4; i++) {
            if (this.isPixelAlpha0(u + this._dir4[i].x, v + this._dir4[i].y)) return true;
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
        if (!this.needUpdatePathToData) return;
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
        this.clearDataValue(this.pathKey);
        this.setDataValue(this.pathKey, pathesData);
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
        return this.uvToPixelIndex(u, v) + 3;
    }

    protected showPath(path: { u: number, v: number }[][]) {
        if (!this.showPathPoints) return;
        no.unschedule(this);
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
            b = 255;
        no.schedule(() => {
            const p = points[i++];
            if (!p) return;
            for (let i = p.u - 3; i <= p.u + 3; i++) {
                for (let j = p.v - 3; j <= p.v + 3; j++) {
                    if (this.isPixelAlpha0(i, j)) continue;
                    const idx = this.uvToPixelIndex(i, j);
                    this._pathPoints.push(idx);
                    this._pathPointTextureBuffer[idx] = r;
                    this._pathPointTextureBuffer[idx + 1] = g;
                    this._pathPointTextureBuffer[idx + 2] = b;
                    this._pathPointTextureBuffer[idx + 3] = 255;
                }
            }
            this._updatePathTexture();
        }, this.interval, points.length, 0, this)
    }

    protected clearPoints() {
        if (!this.showPathPoints) return;
        if (this._pathPoints.length == 0) return;
        for (let i = 0, n = this._pathPoints.length; i < n; i++) {
            const idx = this._pathPoints[i];
            this._pathPointTextureBuffer[idx] = 0;
            this._pathPointTextureBuffer[idx + 1] = 0;
            this._pathPointTextureBuffer[idx + 2] = 0;
            this._pathPointTextureBuffer[idx + 3] = 0;
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
     * 更新扫描状态
     */
    protected updateScanState() {
        this._state++;
        this._doing = false;
        if (this._state > 5) this._state = 0;
    }

    private initDebugSprite() {
        const size = this._size;
        const node = no.newNode('path_point', [Sprite]);
        node.layer = this.node.layer;
        node.parent = this.node;
        const anchor = no.anchor(this.node);
        no.anchor(node, anchor.x, anchor.y);
        this._pathPointTexture = new DynamicAtlasTexture();
        this._pathPointTexture.initWithSize(size.width, size.height);
        // 初始化纹理缓冲区（每个像素4字节RGBA）
        this._pathPointTextureBuffer = new Uint8Array(size.width * size.height * 4);

        // console.log("创建迷雾纹理，尺寸:", width, "x", height);

        // 初始化缓冲区 (全黑不透明)
        for (let i = 0, n = size.width * size.height; i < n; i++) {
            // RGBA: 黑色不透明
            this._pathPointTextureBuffer[i * 4] = 0;     // R
            this._pathPointTextureBuffer[i * 4 + 1] = 0; // G
            this._pathPointTextureBuffer[i * 4 + 2] = 0; // B
            this._pathPointTextureBuffer[i * 4 + 3] = 0; // A (不透明)
        }
        this._pathPointTexture.uploadData(this._pathPointTextureBuffer);
        const sprite = node.getComponent(Sprite);
        sprite.spriteFrame = new SpriteFrame();
        sprite.spriteFrame.texture = this._pathPointTexture;
        this._pathPointSprite = sprite;
        no.size(node, size);
    }

    protected _updatePathTexture() {
        if (this._pathPointTexture) {
            // 上传新数据到GPU
            this._pathPointTexture.uploadData(this._pathPointTextureBuffer);

            // 强制刷新精灵渲染
            if (this._pathPointSprite) {
                this._pathPointSprite.markForUpdateRenderData();
            }
        }
    }

    /**
     * 获取所有边缘像素时回调,默认执行updateState操作，子类重写也要调用updateState
     * @param arr 像素
     */
    protected onGetWholePixels() {
        this.updateScanState();
    }
}

