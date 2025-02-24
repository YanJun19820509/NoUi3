import { DynamicAtlasTexture } from 'NoUi3/engine/atlas';
import { FuckUi } from 'NoUi3/fuckui/FuckUi';
import { no } from 'NoUi3/no';
import { ccclass, Sprite, Node, Vec2, Mask, property, SpriteFrame, Texture2D, Vec3, v3, rect } from 'NoUi3/yj';

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
 *  startPos?:number[],//起始位置
 *  tileInfos?:{type: number, x:number, y:number}[],//地砖信息,直接使用DungeonMapGenerator创建的数据
 * }
 */

@ccclass('SetMinimap')
export class SetMinimap extends FuckUi {

    /** 迷你地图节点 */
    @property({ type: Node, displayName: '迷你地图节点' })
    minimapNode: Node = null;

    /** 迷你地图图集,图集内单图长宽相等,且应尽量小如12px */
    @property({ type: Texture2D, displayName: '迷你地图图集', tooltip: '迷你地图图集内单图长宽相等，且应尽量小如12px' })
    minimapImageSet: Texture2D = null;

    /** 图集内单图尺寸 */
    @property({ displayName: '图集内单图尺寸' })
    minimapCellSize: number = 12;

    /** 放大倍数 */
    @property({ displayName: '放大倍数' })
    scale: number = 3;

    /** 地砖类型与图集映射,下标对应地砖类型 */
    @property({ type: Vec2, displayName: '地砖类型与图集映射', tooltip: '下标对应地砖类型' })
    minimapSetPoses: Vec2[] = [];

    /** 显示迷你地图的精灵 */
    private _minimapSprite: Sprite = null;

    /** 迷你地图缩放比例 */
    private _minimapScale: number = 1;

    /** 当前位置 */
    private _curPos: Vec3;

    /** 纹理是否需要更新 */
    private _textureDirty: boolean = false;

    /** 瓦片图集数据 */
    private _imageSetTileData: Map<string, ArrayBufferView>;

    private _texture: DynamicAtlasTexture = null;

    /**
     * 数据变更处理
     * @param data 包含地图信息、移动信息、地砖信息的数据对象
     */
    protected onDataChange(data: any) {
        const { mapInfo, moveBy, tileInfos, startPos } = data;
        if (mapInfo) {
            this.initMinimap(mapInfo.width, mapInfo.height, mapInfo.cellSize);
            //清除数据源内的mapInfo，避免重复初始化
            this.clearDataValue(`${this.bind_keys}.mapInfo`);
        }
        if (tileInfos) {
            this.setMinimap(tileInfos);
            //清除数据源内的tileInfos，避免重复绘制
            this.clearDataValue(`${this.bind_keys}.tileInfos`);
        }
        if (startPos) {
            if (!this._curPos) {
                this._curPos = v3();
            }
            this._curPos.set(startPos[0] * this._minimapScale * this.scale, startPos[1] * this._minimapScale * this.scale, 0);
            no.position(this._minimapSprite.node, this._curPos);
            this.clearDataValue(`${this.bind_keys}.startPos`);
        }
        if (moveBy) {
            this._curPos.add3f(moveBy[0] * this._minimapScale * this.scale, moveBy[1] * this._minimapScale * this.scale, 0);
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
            no.scale(node, v3(this.scale, this.scale, 1));
        }
        this._minimapScale = this.minimapCellSize / cellSize;
        this._texture = new DynamicAtlasTexture();
        this._texture.initWithSize(width * this._minimapScale, height * this._minimapScale);
        if (!this._imageSetTileData) {
            this.setImageSetTileData();
        }
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
        this._textureDirty = true;
        this.updateMinimap();
    }

    protected _drawTile(x: number, y: number, tile: number) {
        const buffer = this._imageSetTileData.get(`${0}`);
        const cellSize = this.minimapCellSize;
        this._texture.drawTextureBufferAt(buffer, x * cellSize, y * cellSize, cellSize, cellSize);
    }

    /**
     * 更新迷你地图显示
     */
    protected updateMinimap() {
        if (!this._textureDirty) return;
        const sf = new SpriteFrame();
        sf.texture = this._texture;
        this._minimapSprite.spriteFrame = sf;
        this._textureDirty = false;
    }

    private setImageSetTileData() {
        this._imageSetTileData = new Map();
        const cellSize = this.minimapCellSize;
        for (let i = 0, n = this.minimapSetPoses.length; i < n; i++) {
            const { x, y } = this.minimapSetPoses[i];
            const buffer = this._texture.getTextureBuffer(this.minimapImageSet, rect(x, y, cellSize, cellSize));
            this._imageSetTileData.set(`${i}`, buffer);
        }
    }
}
