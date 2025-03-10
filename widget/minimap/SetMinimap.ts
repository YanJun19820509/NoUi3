import { DynamicAtlasTexture } from 'NoUi3/engine/atlas';
import { FuckUi } from 'NoUi3/fuckui/FuckUi';
import { no } from 'NoUi3/no';
import { ccclass, Sprite, Node, Vec2, property, SpriteFrame, Texture2D, Vec3, v3, rect, EventTouch, size } from 'NoUi3/yj';
import { SetFogOfWar } from '../fogOfWar/SetFogOfWar';

/**
 * 迷你地图组件，支持全屏和局部显示，迷雾，点击获取地图位置
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
    @property({ type: Sprite, displayName: '迷你地图节点' })
    minimapSprite: Sprite = null;
    @property({ type: SetFogOfWar, displayName: '迷雾' })
    fogOfWar: SetFogOfWar = null;

    /** 迷你地图图集,图集内单图长宽相等,且应尽量小如12px */
    @property({ type: Texture2D, displayName: '迷你地图图集', tooltip: '迷你地图图集内单图长宽相等，且应尽量小如12px' })
    minimapImageSet: Texture2D = null;

    /** 图集内单图尺寸 */
    @property({ displayName: '图集内单图尺寸' })
    minimapCellSize: number = 12;

    /** 地砖类型与图集映射,下标对应地砖类型 */
    @property({ type: Vec2, displayName: '地砖类型与图集映射', tooltip: '下标对应地砖类型' })
    minimapSetPoses: Vec2[] = [];

    /** 局部显示 */
    @property({ displayName: '局部显示' })
    isPart: boolean = false;

    /** 放大倍数 */
    @property({ displayName: '放大倍数', visible() { return this.isPart; } })
    scale: number = 3;

    /** 角色节点 */
    @property({ type: Node, displayName: '角色节点' })
    roleNode: Node = null;

    @property({ type: no.EventHandlerInfo, displayName: '点击事件', visible() { return !this.isPart; } })
    clickEvent: no.EventHandlerInfo[] = [];

    /** 显示迷你地图的精灵 */
    // private _minimapSprite: Sprite = null;

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
     * 组件加载时的初始化操作
     */
    onLoad() {
        super.onLoad();
        if (!this.isPart)
            this.node.on(Node.EventType.TOUCH_END, this.onClick, this, true);
    }

    /**
     * 组件销毁时的清理操作
     */
    onDestroy(): void {
        if (!this.isPart)
            this.node.off(Node.EventType.TOUCH_END, this.onClick, this, true);
    }

    /**
     * 数据变更处理
     * @param data 包含地图信息、移动信息、地砖信息的数据对象
     */
    protected onDataChange(data: any) {
        const { mapInfo, moveBy, tileInfos, startPos } = data;
        if (!this.isPart) this.scale = 1;
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
            if (this.isPart) {
                no.position(this.minimapSprite.node, this._curPos);
                if (this.fogOfWar)
                    no.position(this.fogOfWar.node, this._curPos);
            } else
                this.roleNode.setPosition(-this._curPos.x, -this._curPos.y);
            this.clearDataValue(`${this.bind_keys}.startPos`);
            this.fogOfWar?.a_setData({
                pos: [-this._curPos.x / this._minimapScale / this.scale, -this._curPos.y / this._minimapScale / this.scale]
            });
        }
        if (moveBy) {
            this._curPos.add3f(moveBy[0] * this._minimapScale * this.scale, moveBy[1] * this._minimapScale * this.scale, 0);
            if (this.isPart) {
                no.position(this.minimapSprite.node, this._curPos);
                if (this.fogOfWar)
                    no.position(this.fogOfWar.node, this._curPos);
            } else
                this.roleNode.setPosition(-this._curPos.x, -this._curPos.y);
            this.fogOfWar?.a_setData({
                pos: [-this._curPos.x / this._minimapScale / this.scale, -this._curPos.y / this._minimapScale / this.scale]
            });
        }
    }

    /**
     * 初始化迷你地图
     * @param width 地图宽度
     * @param height 地图高度
     * @param cellSize 单元格尺寸
     */
    private initMinimap(width: number, height: number, cellSize: number) {
        if (!this.minimapSprite) return;
        const scale = v3(this.scale, this.scale, 1);
        no.scale(this.minimapSprite.node, scale);
        this._minimapScale = this.minimapCellSize / cellSize;
        this._texture = new DynamicAtlasTexture();
        this._texture.initWithSize(width * this._minimapScale, height * this._minimapScale);
        if (!this._imageSetTileData) {
            this.setImageSetTileData();
        }
        if (this.fogOfWar) {
            no.scale(this.fogOfWar.node, scale);
            this.fogOfWar.a_setData({
                size: [width * this._minimapScale, height * this._minimapScale],
                scale: this._minimapScale
            });
        }
        no.size(this.node, size(this._texture.width, this._texture.height));
    }

    /**
     * 设置迷你地图
     * @param tileInfos 地砖信息数组
     */
    private setMinimap(tileInfos: { type: number, x: number, y: number }[]) {
        if (!this.minimapSprite || tileInfos.length == 0) return;
        for (let i = 0, n = tileInfos.length; i < n; i++) {
            const info = tileInfos[i];
            if (info.type < 0) continue;
            this._drawTile(info.x, info.y, info.type);
        }
        this._textureDirty = true;
        this.updateMinimap();
    }

    /**
     * 绘制单个瓦片
     * @param x 瓦片的x坐标
     * @param y 瓦片的y坐标
     * @param tile 瓦片类型
     */
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
        this.minimapSprite.spriteFrame = sf;
        this._textureDirty = false;
    }

    /**
     * 设置图集瓦片数据
     */
    private setImageSetTileData() {
        this._imageSetTileData = new Map();
        const cellSize = this.minimapCellSize;
        for (let i = 0, n = this.minimapSetPoses.length; i < n; i++) {
            const { x, y } = this.minimapSetPoses[i];
            const buffer = this._texture.getTextureBuffer(this.minimapImageSet, rect(x, y, cellSize, cellSize));
            this._imageSetTileData.set(`${i}`, buffer);
        }
    }

    private _tempV31: Vec3 = v3();
    private _tempV32: Vec3 = v3();
    /**
     * 处理点击事件，点击迷你地图获取点击位置与当前位置的相对位置，并以YJMoveHandle的数据格式返回
     * @param e 触摸事件对象
     */
    private onClick(e: EventTouch) {
        if (this.isPart) return;
        e.preventSwallow = true;
        this._tempV31.set(-this._curPos.x, -this._curPos.y, 0);
        const p = e.getUILocation();
        this._tempV32.set(p.x, p.y, 0);
        no.worldPositionInNode(this._tempV32, this.node, this._tempV32);
        const dir = no.angleTo(this._tempV31, this._tempV32);
        const s = this._minimapScale * this.scale;
        no.EventHandlerInfo.execute(this.clickEvent, { type: 'moveto', pos: { x: (this._tempV32.x - this._tempV31.x) / s, y: (this._tempV32.y - this._tempV31.y) / s }, dir });
    }
}
