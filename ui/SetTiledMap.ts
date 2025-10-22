
import { JsonAsset, ccclass, property, menu } from '../yj';
import { YJTiledMapData } from '../base/tiled/YJTiledMapData';
import { YJTiledMapDelegate } from '../base/tiled/YJTiledMapDelegate';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetTiledMap
 * DateTime = Mon Jan 17 2022 14:38:17 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTiledMap.ts
 * FileBasenameNoExtension = SetTiledMap
 * URL = db://assets/Script/common/ui/SetTiledMap.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetTiledMap')
@menu('NoUi/ui/SetTiledMap(设置瓦片地图:string(jsonFilePath))')
/**
 * 瓦片地图设置组件
 * @example
 * // 通过HackUi的数据绑定设置地图JSON路径
 * this.data = 'map/level1';
 * 
 * // 自定义代理实现地图初始化逻辑
 * class MyDelegate extends YJTiledMapDelegate {
 *     onInitMap(mapData) {
 *         // 初始化地图层...
 *     }
 * }
 */
export class SetTiledMap extends HackUi {
    /**
     * 地图代理对象，负责具体的地图初始化逻辑
     * @type {YJTiledMapDelegate}
     */
    @property({ type: YJTiledMapDelegate, displayName: '代理' })
    delegate: YJTiledMapDelegate = null;

    // 当前地图数据实例
    private mapData: YJTiledMapData;

    /**
     * 数据变更处理回调
     * @param {string} data - JSON资源路径 
     * @override
     */
    protected onDataChange(data: any) {
        // 预处理回调
        this.delegate?.onBeforeInitMap();

        // 异步加载JSON资源
        no.assetBundleManager.loadJSON(data, (jsonAsset: JsonAsset) => {
            // 创建地图数据实例
            this.mapData = new YJTiledMapData(jsonAsset.json);
            // 初始化地图
            this.initMap();
            // 释放资源引用
            no.assetBundleManager.decRef(jsonAsset);
        });
    }

    /**
     * 初始化地图核心逻辑
     * 1. 初始化基础地图
     * 2. 遍历所有图层类型初始化对象
     * 3. 执行完成回调
     */
    private initMap() {
        // 初始化基础地图
        this.delegate?.onInitMap(this.mapData);

        // 获取所有图层类型（使用传统for循环替代foreach/for of）
        const layers = this.mapData.layerTypes || [];
        let layerType: string;
        for (let i = 0, n = layers.length; i < n; i++) {
            layerType = layers[i];
            // 初始化每个图层的对象
            this.delegate?.onInitObjects(
                layerType,
                this.mapData.getLayerObjects(layerType)
            );
        }

        // 安全校验节点有效性
        if (!this?.node?.isValid) return;

        // 初始化完成回调
        this.delegate?.onInitComplete();
    }
}
