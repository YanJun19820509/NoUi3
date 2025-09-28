import { DynamicAtlasTexture } from '../../engine/atlas';
import { no } from '../../no';
import { HackUi } from '../../ui/HackUi';
import { ccclass, EDITOR, executeInEditMode, property, Rect, requireComponent, Sprite, SpriteFrame, Texture2D } from '../../yj';

/**
 * 扫描路径组件，扫描图片透明交界处，生成路径
 * 图片路径,图片数据文件路径
 * data: {path:string,dataPath:string}
 * 路径数据生成后，会自动更新到dataWork的scanPath中
 */
@ccclass('SetScanPath')
@requireComponent([Sprite])
@executeInEditMode()
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

    @property({ displayName: '导出数据' })
    get export(): boolean {
        return false;
    }
    set export(value: boolean) {
        this.exportData();
    }

    protected _sprite: Sprite = null!;
    protected _spriteFrame: SpriteFrame;
    protected _texture: DynamicAtlasTexture = null!; // 动态纹理对象
    protected _textureBuffer: Uint8Array = null!; // 纹理数据缓冲区（RGBA格式）
    protected _size: { width: number, height: number };
    protected _pathes: number[][] = [];
    protected _pathPoints: number[] = [];
    //左上右下
    protected _dir4 = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
    //上、右上、右、右下、下、左下、左、左上
    protected _dir8 = [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }];

    // 非透明像素
    // protected _noAlpha0PixelsMap: Map<string, number[]> = new Map();
    // protected _noAlpha0PixelsArr: string[] = [];
    // protected _pixelArr: number[][] = [];
    protected _edgePixelsMap: Map<string, number[]> = new Map();
    /**
     * 0: 无操作
     * 1: 描绘边缘
     * 2: 更新纹理
     * 3: 解析路径
     * 4: 同步数据
     * 5: 显示路径
     */
    protected _state = 0;
    protected _doing = false;
    protected _pathReady = false;

    private _pathPointTexture: DynamicAtlasTexture;
    private _pathPointTextureBuffer: Uint8Array;
    private _pathPointSprite: Sprite;

    onDestroy(): void {
        this._spriteFrame?.destroy();
        this._spriteFrame = null;
        this._sprite = null;
        this._texture?.destroy();
        this._texture = null;
        this._textureBuffer = null;
        this._size = null;
        if (this._pathPointSprite) {
            this._pathPointSprite.spriteFrame = null;
            this._pathPointSprite.node?.destroy();
            this._pathPointSprite = null;
            this._pathPointTexture?.destroy();
            this._pathPointTexture = null;
            this._pathPointTextureBuffer = null;
            this._pathPoints.length = 0;
        }
    }

    protected onDataChange(data: any): void {
        const { path, dataPath } = data;
        if (path) {
            no.unschedule(this);
            this._pathReady = false;
            if (!this._sprite)
                this._sprite = this.getComponent(Sprite);
            this._sprite.spriteFrame = null;
            this._spriteFrame?.destroy();
            this._spriteFrame = null;
            this._texture?.destroy();
            this._texture = null;
            this._textureBuffer = null;
            if (this._pathPointSprite) {
                this._pathPointSprite.spriteFrame = null;
                this._pathPointSprite.node.destroy();
                this._pathPointSprite = null;
                this._pathPointTexture?.destroy();
                this._pathPointTexture = null;
                this._pathPointTextureBuffer = null;
                this._pathPoints.length = 0;
            }
            no.assetBundleManager.loadTexture(path + '/texture', t => {
                this.init(t);
            });
            this.clearDataValue(this.bind_keys + '.path');
        }
        if (dataPath) {
            no.assetBundleManager.loadJSON(dataPath, t => {
                this.initPixelData(t.json);
            });
            this.clearDataValue(this.bind_keys + '.dataPath');
        }
    }


    /**
     * 初始化纹理
     * @param texture 纹理
     */
    protected init(texture: Texture2D) {
        this._size = { width: texture.width, height: texture.height };
        this._texture = new DynamicAtlasTexture();
        this._texture.initWithSize(this._size.width, this._size.height);
        this._textureBuffer = this._texture.getTextureBuffer(texture, new Rect(0, 0, this._size.width, this._size.height));
        this._texture.uploadData(this._textureBuffer);
        this._spriteFrame = new SpriteFrame();
        this._spriteFrame.texture = this._texture;
        this._sprite.spriteFrame = this._spriteFrame;
        texture.decRef();
        // this.scheduleOnce(() => {
        //     this.initEdgePixels();
        //     this.updateScanState();
        // });
    }

    protected initPixelData(data: any) {
        if (!this._texture) {
            this.scheduleOnce(() => {
                this.initPixelData(data);
            }, 0.05);
            return;
        }
        const { pixels, pathes }: { pixels: number[], pathes: number[][] } = data;
        this._edgePixelsMap.clear();
        for (let i = 0, n = pixels.length; i < n; i += 2) {
            const u = pixels[i];
            const v = pixels[i + 1];
            this._edgePixelsMap.set(this.key(u, v), [u, v, 0]);
        }
        this._pathes = pathes.slice();
        this._state = 3;
        this.updateScanState();
    }

    protected lateUpdate(dt: number): void {
        if (EDITOR) return;
        if (this._state == 0 || this._doing) return;
        this._doing = true;
        switch (this._state) {
            case 1:
                this.onGetWholePixels();
                break;
            case 2:
                this._updateTexture();
                break;
            case 3:
                this.prepareParsePath();
                this.parsePath();
                break;
            case 4:
                this.updateToData();
                if (!this._pathReady) {
                    this.scheduleOnce(() => {
                        this._pathReady = true;
                    }, 0.05);
                }
                break;
            case 5:
                this.showPath();
                this.updateScanState();
                break;
        }
    }

    private prepareParsePath() {
        this._pathes.length = 0;
        for (const [key, value] of this._edgePixelsMap) {
            value[2] = 0;
        }
        //排序
        // const arr = Array.from(this._edgePixelsMap.values());
        // no.sortArray(arr, (a, b) => { return a[0] - b[0]; });
        // this._edgePixelsMap.clear();
        // for (let i = 0, n = arr.length; i < n; i++) {
        //     const a = arr[i];
        //     a[2] = 0;
        //     this._edgePixelsMap.set(this.key(a[0], a[1]), a);
        // }
    }

    /**
     * 解析路径
     */
    protected parsePath() {
        const pathes: number[][] = [];
        while (1) {
            const path = this.splitPath();
            const len = path.length;
            if (len > 5) {
                pathes.push(path);
            } else if (len === 0) break;
        }
        let n = pathes.length
        //合并路径
        if (n > 1) {
            //判断两条路径前后点是否连接的最大距离
            const maxDis = this.step * 2;
            //按x从左到右排序,确定路径之间的先后顺序
            no.sortArray(pathes, (a, b) => {
                return a[0] - b[0];
            });
            let i = 0;
            while (n > 1) {
                const path1 = pathes[i];
                const end1 = { x: path1[path1.length - 2], y: path1[path1.length - 1] };
                const arr: { path1: number, path2: number, dis: number }[] = [];
                for (let j = i + 1; j < n; j++) {
                    const path2 = pathes[j];
                    const start2 = { x: path2[0], y: path2[1] };
                    const dis = no.distance(end1, start2);
                    if (dis <= maxDis) {
                        arr.push({ path1: 0, path2: j, dis: dis });
                    }
                }
                if (arr.length == 0) {
                    if (i < n - 2) {
                        i++;
                        continue;
                    } else break;
                }
                no.sortArray(arr, (a, b) => {
                    return a.dis - b.dis;
                });
                const idx = arr[0].path2;
                const nextPath = pathes.splice(idx, 1)[0];
                path1.push(...nextPath);
                n--;
            }
        }
        this._pathes = pathes;
        this.updateScanState();
    }

    /**
     * 将边缘像素分割成路径
     * @param arr 边缘像素
     * @returns 路径
     */
    protected splitPath() {
        const path: number[] = [];
        for (const [k, v] of this._edgePixelsMap) {
            if (v[2] === 0) {
                v[2] = 1;
                path.push(v[0], v[1]);
                break;
            }
        }
        if (path.length == 0) return [];

        let n = this.step;
        let curU = path[0];
        let curV = path[1];
        let lastDir: number = -1;
        while (true) {
            let found = false;

            // 检查8个方向的邻居
            for (let i = 0; i < 8; i++) {
                const d = this._dir8[i];
                const u = curU + d.x;
                if (u < 0 || u >= this._size.width) continue;
                const v = curV + d.y;
                if (v < 0 || v >= this._size.height) continue;
                const key = this.key(u, v);
                const value = this._edgePixelsMap.get(key);
                if (value && value[2] === 0) {
                    // 从Set中移除已访问的点
                    value[2] = 1;
                    if (--n === 0) {
                        path.push(u, v);
                        n = this.step;
                    } else if (Math.abs(lastDir - i) > 1) {
                        if (n > 15) {
                            path.pop();
                            path.pop();
                        }
                        path.push(u, v);
                        n = this.step;
                    }
                    lastDir = i;
                    curU = u;
                    curV = v;
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
            if (path.length < 4) continue;
            const pathData: { x: number, y: number }[] = [];
            let lastX = 0, lastY = 0;
            for (let j = 0, m = path.length; j < m; j += 2) {
                const [x, y] = this.uvToXy(path[j], path[j + 1]);
                // if (j == 0) {
                //     lastX = x;
                //     lastY = y;
                // }
                // else if (x < lastX && y > lastY) continue;
                // else {
                //     lastX = x;
                //     lastY = y;
                // }
                pathData.push({ x, y });
            }
            pathesData.push(pathData);
        }
        this.clearDataValue(this.pathKey);
        this.setDataValue(this.pathKey, pathesData);
        this.updateScanState();
    }

    protected isEdge(u: number, v: number) {
        return u == 0 || u == this._size.width - 1 || v == 0 || v == this._size.height - 1;
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
        if (u < 0 || u >= this._size.width) return false;
        if (v != null && (v < 0 || v >= this._size.height)) return false;
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

    protected showPath() {
        if (!this.showPathPoints) return;
        no.unschedule(this);
        this.initDebugSprite();
        this.clearPathPoints();
        const path = this._pathes;
        for (let i = 0, n = path.length; i < n; i++) {
            this.showPoints(path[i]);
        }
    }

    /**
     * 显示点, 用于调试
     * @param points 点
     */
    protected showPoints(points: number[]) {
        let k = 0;
        const r = Math.random() * 255,
            g = Math.random() * 255,
            b = 255;
        const len = points.length;
        no.schedule(() => {
            const u = points[k++];
            const v = points[k++];
            if (!u || !v) return;
            if (this.isPixelAlpha0(u, v)) {
                console.log('showPoints', len, k)
                return;
            }
            for (let i = u - 3; i <= u + 3; i++) {
                for (let j = v - 3; j <= v + 3; j++) {
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

    protected clearPathPoints() {
        if (!this.showPathPoints) return;
        if (this._pathPoints.length == 0) return;
        for (let i = 0, n = this._pathPoints.length; i < n; i++) {
            const idx = this._pathPoints[i];
            this._pathPointTextureBuffer[idx] = 0;
            this._pathPointTextureBuffer[idx + 1] = 0;
            this._pathPointTextureBuffer[idx + 2] = 0;
            this._pathPointTextureBuffer[idx + 3] = 0;
        }
        this._pathPoints.length = 0;
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
        this.updateScanState();
    }

    /**
     * 获取两个点之间的角度
     * @param u1 圆心点1X坐标
     * @param v1 圆心点1Y坐标
     * @param u2 目标点X坐标
     * @param v2 目标点Y坐标
     */
    protected angleTo(u1: number, v1: number, u2: number, v2: number) {
        //因为纹理坐标系原点在左上角，所以需要转换
        let p1 = { x: u1, y: v1 };
        let p2 = { x: u2, y: v2 };
        const a = 360 - no.angleTo(p1, p2).angle;
        p1 = null;
        p2 = null;
        return a;
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
        if (this._pathPointSprite) return;
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

        // 初始化缓冲区 (全黑透明)
        for (let i = 0, n = size.width * size.height; i < n; i++) {
            // RGBA: 黑色不透明
            this._pathPointTextureBuffer[i * 4] = 0;     // R
            this._pathPointTextureBuffer[i * 4 + 1] = 0; // G
            this._pathPointTextureBuffer[i * 4 + 2] = 0; // B
            this._pathPointTextureBuffer[i * 4 + 3] = 0; // A (透明)
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

    protected isValidPixel(u: number, v: number) {
        return u >= 0 && u < this._size.width && v >= 0 && v < this._size.height;
    }

    /********* 导出数据 *********/
    protected exportData() {
        const sprite = this.getComponent(Sprite);
        if (!sprite.spriteFrame) return;
        const texture = sprite.spriteFrame.texture as Texture2D;
        const size = { width: texture.width, height: texture.height };
        this._size = size;
        this._texture = new DynamicAtlasTexture();
        this._texture.initWithSize(size.width, size.height);
        this._textureBuffer = this._texture.getTextureBuffer(texture, new Rect(0, 0, size.width, size.height));
        this._texture.uploadData(this._textureBuffer);
        this.initEdgePixels();
        this.prepareParsePath();
        this.parsePath();
        this.showPath();
        const arr: number[] = [];
        this._edgePixelsMap.forEach((value, key) => {
            arr.push(value[0], value[1]);
        });
        console.log(JSON.stringify({ pixels: arr, pathes: this._pathes }));
    }

    protected initEdgePixels() {
        this._edgePixelsMap.clear();
        for (let i = 0; i < this._size.width; i++) {
            for (let j = 0; j < this._size.height; j++) {
                if (!this.isEdgePixel(i, j)) continue;
                const key = this.key(i, j);
                this._edgePixelsMap.set(key, [i, j]);
            }
        }
    }

    /**
     * 判断像素是否为边缘像素, 边缘像素的邻居(非透明)至少得有3个，并且至少有一个透明像素
     * @param u 像素X坐标
     * @param v 像素Y坐标
     * @returns 是否为边缘像素
     */
    protected isEdgePixel(u: number, v: number) {
        if (this.isPixelAlpha0(u, v)) return false;
        let hasAlpha0 = false;
        for (let i = 0; i < 4; i++) {
            const d = this._dir4[i];
            if (this.isPixelAlpha0(u + d.x, v + d.y)) {
                hasAlpha0 = true;
                break;
            }
        }
        if (!hasAlpha0) return false;
        let neighborCount = 0;
        for (let j = 0; j < 8; j++) {
            const d = this._dir8[j];
            if (!this.isPixelAlpha0(u + d.x, v + d.y)) {
                neighborCount++;
                // 如果已经有3个邻居，可以提前退出内层循环
                //邻居至少得有3个，如果按2个邻居判定为孤立，它的下一个邻居被判定为孤立而删除后，它自己也会变成孤立
                if (neighborCount >= 3) {
                    return true;
                }
            }
        }
        return false;
    }

    protected checkEdgePixel(u: number, v: number) {
        const key = this.key(u, v);
        if (!this.isEdgePixel(u, v)) {
            if (this._edgePixelsMap.has(key))
                this._edgePixelsMap.delete(key);
            return false;
        } else {
            if (!this._edgePixelsMap.has(key))
                this._edgePixelsMap.set(key, [u, v]);
            return true;
        }
    }

    private key(u: number, v: number) {
        return u + '_' + v;
    }
}

