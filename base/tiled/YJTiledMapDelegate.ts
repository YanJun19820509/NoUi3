
import { ccclass, menu, Component, Node } from '../../yj';
import { YJTiledMapData } from './YJTiledMapData';

/**
 * Predefined variables
 * Name = YJTiledMapDelegate
 * DateTime = Fri Jan 14 2022 17:33:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTiledMapDelegate.ts
 * FileBasenameNoExtension = YJTiledMapDelegate
 * URL = db://assets/Script/NoUi3/base/tiled/YJTiledMapDelegate.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * SetTileMap的代理，需要子类实现具体逻辑
 */
@ccclass('YJTiledMapDelegate')
@menu('NoUi/ui/YJTileMapDelegate(SetTileMap的代理)')
export class YJTiledMapDelegate extends Component {
    /**
     * 地图初始化前
     */
    public onBeforeInitMap(): void { }

    /**
     * 地图初始化时
     * @param mapInfo tiled数据
     */
    public onInitMap(mapInfo: YJTiledMapData) { }

    /**
     * 初始化tiled中设置的object
     * @param type 在tiled中添加的自定义属性key为type的值
     * @param info object对象数据
     */
    public onInitObjects(type: string, info: any) { }

    /**
     * 初始化完成时
     */
    public onInitComplete(): void { }
}