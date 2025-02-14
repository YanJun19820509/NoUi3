import { FuckUi } from 'NoUi3/fuckui/FuckUi';
import { no } from 'NoUi3/no';
import { ccclass, Sprite, Node, ImageAsset, Vec2, Mask, property, size, SpriteFrame, Texture2D, Vec3, v3 } from 'NoUi3/yj';
import { TileType } from '../../../res/test/maze/DungeonMapGenerator';

/**
 * 
 * Author mqsy_yj
 * DateTime Fri Feb 14 2025 09:33:20 GMT+0800 (中国标准时间)
 * data:{
 *  mapInfo?:{
 *      width:number,//大地图宽度
 *      height:number,//大地图高度
 *      cellSize:number,//地砖尺寸
 *  },
 *  moveBy?:number[],//移动距离
 *  tileInfos?:{type: number, x:number, y:number}[],//地砖信息,直接使用DungeonMapGenerator创建的数据
 * }
 */

@ccclass('SetMinimap')
export class SetMinimap extends FuckUi {

    @property({ type: Node, displayName: '迷你地图节点' })
    minimapNode: Node = null;
    @property({ type: ImageAsset, displayName: '迷你地图图集', tooltip: '迷你地图图集内单图长宽相等，且应尽量小如12px' })
    minimapImageSet: ImageAsset = null;
    @property({ displayName: '图集内单图尺寸' })
    minimapCellSize: number = 12;
    @property({ type: Vec2, displayName: '地砖类型与图集映射', tooltip: '下标对应地砖类型' })
    minimapSetPoses: Vec2[] = [];

    /** 瓦片图集 */
    protected _tileset: HTMLCanvasElement;
    /** 画布元素 */
    private _canvas: HTMLCanvasElement | null = null;
    /** 画布上下文 */
    private _context: CanvasRenderingContext2D | null = null;
    /** 显示迷你地图的精灵 */
    private _minimapSprite: Sprite = null;
    private _minimapScale: number = 1;
    /**
     * 地砖节点映射,key为uv坐标字符串,value为地砖节点
     */
    private _tileInfoMap: Map<string, any> = new Map();
    private _curPos: Vec3;
    private _textureDirty: boolean = false;

    protected onDataChange(data: any) {
        const { mapInfo, moveBy, tileInfos } = data;
        if (mapInfo) {
            this.initMinimap(mapInfo.width, mapInfo.height, mapInfo.cellSize);
        }
        if (tileInfos) {
            this._tileInfoMap.clear();
            for (let i = 0, n = tileInfos.length; i < n; i++) {
                const info = tileInfos[i];
                if (info.type == TileType.EMPTY) continue;
                this._tileInfoMap.set(`${info.x}_${info.y}`, info);
            }
        }
        if (moveBy) {
            if (!this._curPos) {
                this._curPos = no.position(this._minimapSprite.node).clone();
            }
            this._curPos.add3f(moveBy[0] * this._minimapScale, moveBy[1] * this._minimapScale, 0);
            no.position(this._minimapSprite.node, this._curPos);
            this.setTiles();
        }
    }

    private initMinimap(width: number, height: number, cellSize: number) {
        if (!this.minimapNode) return;
        if (!this.minimapNode.getComponent(Mask)) {
            this.minimapNode.addComponent(Mask);
        }
        if (!this._minimapSprite) {
            const node = no.newNode('MinimapSprite', [Sprite]);
            node.parent = this.minimapNode;
            this._minimapSprite = node.getComponent(Sprite);
            // this._minimapSprite.spriteFrame = new SpriteFrame();
        }
        if (!this._canvas) {
            const { canvas, context } = no.canvasPool.get();
            this._canvas = canvas;
            this._context = context;
            this._minimapScale = this.minimapCellSize / cellSize;
            this._canvas.width = width * this._minimapScale;
            this._canvas.height = height * this._minimapScale;
            this._context.fillStyle = 'black';
            this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
            no.size(this._minimapSprite.node, size(this._canvas.width, this._canvas.height));
        }
        this._tileset = this.minimapImageSet.data as HTMLCanvasElement;
    }

    private setTiles() {
        if (this._tileInfoMap.size == 0) return;
        const pos = this._minimapSprite.node.position;
        //节点坐标与在屏幕中心显示的坐标相反
        const x = -pos.x;
        const y = -pos.y;
        const uv = this.xyToUv(x, y);
        const visibleUv: string[] = [];
        const nodeSize = no.size(this.node);
        const r = Math.floor(Math.min(nodeSize.width, nodeSize.height) / 2 / this.minimapCellSize);
        for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
                const u = uv[0] + i;
                const v = uv[1] + j;
                visibleUv[visibleUv.length] = `${u}_${v}`;
            }
        }

        const tileInfos: any[] = [];
        for (let i = 0, n = visibleUv.length; i < n; i++) {
            const key = visibleUv[i];
            const data = this._tileInfoMap.get(key);
            if (data) {
                tileInfos[tileInfos.length] = data;
                this._tileInfoMap.delete(key);
            }
        }
        this.setMinimap(tileInfos);
    }

    private setMinimap(tileInfos: { type: number, x: number, y: number }[]) {
        if (!this.minimapNode || tileInfos.length == 0) return;
        for (let i = 0, n = tileInfos.length; i < n; i++) {
            const info = tileInfos[i];
            this._drawTile(info.x, info.y, info.type);
        }
        this.updateMinimap();
    }

    /**
     * 绘制单个瓦片
     * @param x x坐标
     * @param y y坐标
     * @param tile 瓦片类型
     */
    protected _drawTile(x: number, y: number, tile: number) {
        const TILE_SIZE = this.minimapCellSize;
        if (tile < 0) return;
        const pos = this.minimapSetPoses[0];
        this._context.drawImage(
            this._tileset,
            pos.x,
            pos.y,
            TILE_SIZE,
            TILE_SIZE,
            x * TILE_SIZE,
            y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE);
        this._textureDirty = true;
    }

    protected updateMinimap() {
        if (!this._textureDirty) return;
        const t = new Texture2D();
        t.image = new ImageAsset(this._canvas);
        const sf = new SpriteFrame();
        sf.texture = t;
        this._minimapSprite.spriteFrame = sf;
        this._textureDirty = false;
    }
    /**
     * 世界坐标转UV坐标
     * 当格子数据为偶数时，x在[0,128)内u为0，x在[-128,0)内u为-1,可以直接用Math.floor来处理
     * 当格子数据为奇数时，x在(-64,64)内u为0，x在(-192,-64]内u为-1,不能直接用Math.floor来处理
     * @param x x坐标
     * @param y y坐标
     * @returns UV坐标数组[u,v]
     */
    private xyToUv(x: number, y: number) {
        const u = Math.floor(x / this.minimapCellSize),
            v = Math.floor(y / this.minimapCellSize);
        return [u, v];
    }
}
