import { ccclass, menu, Component } from '../../yj';
import { YJTiledMapData } from './YJTiledMapData';

/**
 * Predefined variables
 * Name = YJTiledMapDelegate
 * DateTime = Fri Jan 14 2022 17:33:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTiledMapDelegate.ts
 * FileBasenameNoExtension = YJTiledMapDelegate
 * URL = db://assets/Script/common/base/tiled/YJTiledMapDelegate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * SetTileMap的代理，需要子类实现具体逻辑
 */
@ccclass('YJTiledMapDelegate')
@menu('NoUi/ui/YJTileMapDelegate(SetTileMap的代理)')
/**
 * 地图代理类，用于处理TiledMap的初始化逻辑
 * 
 * @desc
 * - 提供地图初始化前、初始化时、初始化完成时和地图锚点设置的回调接口
 * - 子类需要实现具体的初始化逻辑
 * 
 */

export class YJTiledMapDelegate extends Component {
    /**
     * 地图初始化前回调
     * @desc 
     * - 在地图数据加载前触发
     * - 适合执行预加载资源、初始化变量等操作
     * @example
     * // 预加载地图纹理
     * preloadMapTextures() {
     *     no.loader.loadRes(this.mapInfo.tilesets.values().next().value.image, SpriteFrame);
     * }
     */
    public onBeforeInitMap(): void { }

    /**
     * 地图初始化时回调
     * @param mapInfo 解析后的地图数据对象
     * @desc 
     * - 当地图数据解析完成后触发
     * - 可以获取地图基本信息：mapSize/tileSize/layers等
     * @example
     * // 获取地图尺寸并设置相机
     * const mapSize = mapInfo.mapSize;
     * cameraCtrl.setMapBounds(mapSize.width, mapSize.height);
     */
    public onInitMap(mapInfo: YJTiledMapData) { }

    /**
     * 初始化地图对象回调
     * @param type 对象类型（对应Tiled中自定义的type属性）
     * @param info 对象详细信息
     * @desc 
     * - 每个对象包含：x/y坐标、width/height尺寸、properties自定义属性等
     * - 不同类型对象应实现不同的初始化逻辑
     * @example
     * // 初始化NPC对象
     * if(type === 'npc'){
     *     const npc = instantiate(npcPrefab);
     *     npc.position = v2(info.x, info.y);
     *     npc.getComponent(NPC).init(info.properties);
     * }
     */
    public onInitObjects(type: string, info: any) { }

    /**
     * 地图初始化完成回调
     * @desc 
     * - 所有地图元素初始化完成后触发
     * - 适合执行游戏逻辑启动、UI显示等操作
     * @example
     * // 显示开始游戏按钮
     * startButton.active = true;
     * // 触发游戏开始事件
     * no.evn.emit('game_start');
     */
    public onInitComplete(): void { }

    // /**
    //  * 
    //  * @param tilePos 
    //  * @param node 
    //  * @returns 
    //  */
    // public static convertTilePosInNode(tilePos: { x: number, y: number }, node: Node) {
    //     const anchor = no.anchor(node),
    //         size = no.size(node),
    //         w = size.width * anchor.x,
    //         h = size.height * anchor.y;
    //     return [tilePos.x - w, h - tilePos.y];
    // }
}