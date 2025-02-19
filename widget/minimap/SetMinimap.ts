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

    /** 迷你地图节点 */
    @property({ type: Node, displayName: '迷你地图节点' })
    minimapNode: Node = null;

    /** 迷你地图图集,图集内单图长宽相等,且应尽量小如12px */
    @property({ type: ImageAsset, displayName: '迷你地图图集', tooltip: '迷你地图图集内单图长宽相等，且应尽量小如12px' })
    minimapImageSet: ImageAsset = null;

    /** 图集内单图尺寸 */
    @property({ displayName: '图集内单图尺寸' })
    minimapCellSize: number = 12;

    /** 放大倍数 */
    @property({ displayName: '放大倍数' })
    scale: number = 3;

    /** 地砖类型与图集映射,下标对应地砖类型 */
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

    /** 迷你地图缩放比例 */
    private _minimapScale: number = 1;

    /** 当前位置 */
    private _curPos: Vec3;

    /** 纹理是否需要更新 */
    private _textureDirty: boolean = false;

    /**
     * 数据变更处理
     * @param data 包含地图信息、移动信息、地砖信息的数据对象
     */
    protected onDataChange(data: any) {
        const { mapInfo, moveBy, tileInfos } = data;
        if (mapInfo) {
            this.initMinimap(mapInfo.width, mapInfo.height, mapInfo.cellSize);
        }
        if (tileInfos) {
            this._context.fillStyle = 'black';
            this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);
            this.setMinimap(tileInfos);
        }
        if (moveBy) {
            if (!this._curPos) {
                this._curPos = no.position(this._minimapSprite.node).clone();
            }
            this._curPos.add3f(moveBy[0] * this._minimapScale, moveBy[1] * this._minimapScale, 0);
            no.position(this._minimapSprite.node, this._curPos);
        }
    }

    /**
     * 初始化迷你地图
     * @param width 地图宽度
     * @param height 地图高度
     * @param cellSize 单元格尺寸
     */
    private initMinimap(width: number, height: number, cellSize: number) {
        if (!this.minimapNode) return;
        if (!this.minimapNode.getComponent(Mask)) {
            this.minimapNode.addComponent(Mask);
        }
        if (!this._minimapSprite) {
            const node = no.newNode('MinimapSprite', [Sprite]);
            node.parent = this.minimapNode;
            this._minimapSprite = node.getComponent(Sprite);
        }
        if (!this._canvas) {
            const { canvas, context } = no.canvasPool.get();
            this._canvas = canvas;
            this._context = context;
            this._minimapScale = this.minimapCellSize * this.scale / cellSize;
            this._canvas.width = width * this._minimapScale;
            this._canvas.height = height * this._minimapScale;
            no.size(this._minimapSprite.node, size(this._canvas.width, this._canvas.height));
        }
        this._tileset = this.minimapImageSet.data as HTMLCanvasElement;
    }

    /**
     * 设置迷你地图
     * @param tileInfos 地砖信息数组
     */
    private setMinimap(tileInfos: { type: number, x: number, y: number }[]) {
        if (!this.minimapNode || tileInfos.length == 0) return;
        for (let i = 0, n = tileInfos.length; i < n; i++) {
            const info = tileInfos[i];
            if (info.type < 0) continue;
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
        const TILE_SIZE = this.minimapCellSize,
            scaleTileSize = TILE_SIZE * this.scale;
        const pos = this.minimapSetPoses[0];
        this._context.drawImage(
            this._tileset,
            pos.x,
            pos.y,
            TILE_SIZE,
            TILE_SIZE,
            x * scaleTileSize,
            y * scaleTileSize,
            scaleTileSize,
            scaleTileSize);
        this._textureDirty = true;
    }

    /**
     * 更新迷你地图显示
     */
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
        const u = Math.floor((x + this._canvas.width / 2) / this.minimapCellSize / this.scale),
            v = Math.floor((y + this._canvas.height / 2) / this.minimapCellSize / this.scale);
        return [u, v];
    }
}
