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
/**
 * 迷你地图组件，支持全屏和局部显示，迷雾效果，点击获取地图位置
 * @example
 * // 编辑器配置示例：
 * // 1. 拖入地图精灵节点到minimapSprite属性
 * // 2. 配置图集纹理minimapImageSet和图集坐标映射minimapSetPoses
 * // 3. 设置地砖尺寸和缩放参数
 * // 4. 绑定角色节点用于位置同步
 * 
 * // 代码调用示例：
 * // 通过数据驱动更新地图信息
 * this.node.getComponent(SetMinimap).a_setData({
 *     mapInfo: { width: 100, height: 100, cellSize: 32 },
 *     tileInfos: [{type:1, x:10, y:10}, {type:2, x:11, y:10}],
 *     startPos: [50, 50]
 * });
 * 
 * // 点击事件处理示例：
 * // 监听点击事件获取目标坐标（返回格式：{type:'moveto', pos:{x,y}, dir:方向角度}）
 * no.EventHandlerInfo.add(this.node, 'SetMinimap', 'clickEvent', (data) => {
 *     cc.log('Move to:', data.pos);
 * });
 */
export class SetMinimap extends FuckUi {
    /** 迷你地图显示精灵组件（需提前拖入编辑器） */
    @property({ type: Sprite, displayName: '迷你地图节点' })
    minimapSprite: Sprite = null;

    /** 迷雾效果控制器组件（可选） */
    @property({ type: SetFogOfWar, displayName: '迷雾' })
    fogOfWar: SetFogOfWar = null;

    /** 迷你地图图集纹理（要求：图集内单图长宽相等，推荐12-32px小图） */
    @property({ type: Texture2D, displayName: '迷你地图图集', tooltip: '迷你地图图集内单图长宽相等，且应尽量小如12px' })
    minimapImageSet: Texture2D = null;

    /** 图集内单个瓦片的像素尺寸（需与实际纹理尺寸一致） */
    @property({ displayName: '图集内单图尺寸' })
    minimapCellSize: number = 12;

    /** 地砖类型与图集坐标映射表（数组下标对应地砖类型，Vec2值对应图集坐标） */
    @property({ type: Vec2, displayName: '地砖类型与图集映射', tooltip: '下标对应地砖类型' })
    minimapSetPoses: Vec2[] = [];

    /** 是否局部显示模式（true: 跟随角色移动的局部地图，false: 全屏静态地图） */
    @property({ displayName: '局部显示' })
    isPart: boolean = false;

    /** 地图显示放大倍数（仅在局部显示模式生效） */
    @property({ displayName: '放大倍数', visible() { return this.isPart; } })
    scale: number = 3;

    /** 角色参照节点（用于同步位置信息） */
    @property({ type: Node, displayName: '角色节点' })
    roleNode: Node = null;

    /** 地图点击事件处理器（全屏模式专用） */
    @property({ type: no.EventHandlerInfo, displayName: '点击事件', visible() { return !this.isPart; } })
    clickEvent: no.EventHandlerInfo[] = [];

    // 以下为私有属性 ------------------------------
    /** 动态图集纹理实例（用于实时生成地图纹理） */
    private _texture: DynamicAtlasTexture = null;
    /** 地图缩放比例（根据cellSize自动计算） */
    private _minimapScale: number = 1;
    /** 当前地图中心位置（世界坐标） */
    private _curPos: Vec3;
    /** 纹理脏标记（true时需要更新精灵显示） */
    private _textureDirty: boolean = false;
    /** 瓦片纹理数据缓存（key: 地砖类型，value: 纹理buffer） */
    private _imageSetTileData: Map<string, ArrayBufferView>;
    /** 临时计算向量1（用于优化内存分配） */
    private _tempV31: Vec3 = v3();
    /** 临时计算向量2（用于优化内存分配） */
    private _tempV32: Vec3 = v3();

    /**
     * 组件加载初始化
     * @override
     */
    onLoad() {
        super.onLoad();
        if (!this.isPart) {
            // 全屏模式注册点击事件
            this.minimapSprite.node.on(Node.EventType.TOUCH_END, this.onClick, this, true);
        }
    }

    /**
     * 组件销毁时清理
     * @override
     */
    onDestroy(): void {
        if (!this.isPart) {
            this.minimapSprite.node.off(Node.EventType.TOUCH_END, this.onClick, this, true);
        }
        // 释放动态纹理资源
        this._texture?.destroy();
    }

    /**
     * 数据驱动更新处理
     * @param data 更新数据对象，包含：
     * - mapInfo: 地图元信息 {width, height, cellSize}
     * - moveBy: 相对移动量 [x, y]
     * - tileInfos: 地砖数据数组 {type, x, y}
     * - startPos: 初始位置 [x, y]
     * @override
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
     * 初始化迷你地图基础参数
     * @param width 游戏世界地图宽度（单位：地砖数量）
     * @param height 游戏世界地图高度（单位：地砖数量）
     * @param cellSize 游戏世界单个地砖尺寸（像素）
     */
    private initMinimap(width: number, height: number, cellSize: number) {
        if (!this.minimapSprite) return;
        const scale = v3(this.scale, this.scale, 1);
        no.scale(this.minimapSprite.node, scale);
        this._minimapScale = this.minimapCellSize / cellSize;
        this._texture?.destroy();
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
     * 批量绘制地图瓦片
     * @param tileInfos 地砖数据数组，每个元素包含：
     * - type: 地砖类型（对应minimapSetPoses下标）
     * - x: 地砖X坐标（单位：地砖数量）
     * - y: 地砖Y坐标（单位：地砖数量）
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
     * 绘制单个瓦片到动态纹理
     * @param x 瓦片X坐标（单位：地砖数量）
     * @param y 瓦片Y坐标（单位：地砖数量）
     * @param tile 瓦片类型（对应minimapSetPoses下标）
     */
    protected _drawTile(x: number, y: number, tile: number) {
        const buffer = this._imageSetTileData.get(`${0}`);
        const cellSize = this.minimapCellSize;
        this._texture.drawTextureBufferAt(buffer, x * cellSize, y * cellSize, cellSize, cellSize);
    }

    /**
     * 更新精灵显示（当纹理变化时调用）
     */
    protected updateMinimap() {
        if (!this._textureDirty) return;
        const sf = new SpriteFrame();
        sf.texture = this._texture;
        this.minimapSprite.spriteFrame = sf;
        this._textureDirty = false;
    }

    /**
     * 预生成瓦片纹理数据缓存
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

    /**
     * 处理地图点击事件（全屏模式专用）
     * @param e 触摸事件对象
     * @description 计算点击位置的世界坐标，转换为游戏世界坐标后派发事件
     */
    private onClick(e: EventTouch) {
        if (this.isPart) return;
        e.preventSwallow = true;
        this._tempV31.set(-this._curPos.x, -this._curPos.y, 0);
        const p = e.getUILocation();
        this._tempV32.set(p.x, p.y, 0);
        no.worldPositionInNode(this._tempV32, this.minimapSprite.node, this._tempV32);
        const dir = no.angleTo(this._tempV31, this._tempV32);
        const s = this._minimapScale * this.scale;
        no.EventHandlerInfo.execute(this.clickEvent, { type: 'moveto', pos: { x: (this._tempV32.x - this._tempV31.x) / s, y: (this._tempV32.y - this._tempV31.y) / s }, dir });
    }
}
