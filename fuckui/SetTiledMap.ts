
import { JsonAsset, _decorator } from './yj';
import { YJTiledMapData } from '../base/tiled/YJTiledMapData';
import { YJTiledMapDelegate } from '../base/tiled/YJTiledMapDelegate';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetTiledMap
 * DateTime = Mon Jan 17 2022 14:38:17 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTiledMap.ts
 * FileBasenameNoExtension = SetTiledMap
 * URL = db://assets/Script/NoUi3/fuckui/SetTiledMap.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetTiledMap')
@menu('NoUi/ui/SetTiledMap(设置瓦片地图:string(jsonFilePath))')
export class SetTiledMap extends FuckUi {

    @property({ type: YJTiledMapDelegate, displayName: '代理' })
    delegate: YJTiledMapDelegate = null;

    private mapData: YJTiledMapData;

    protected onDataChange(data: any) {
        this.delegate?.onBeforeInitMap();
        no.assetBundleManager.loadJSON(data, (jsonAsset: JsonAsset) => {
            this.mapData = new YJTiledMapData(jsonAsset.json);
            this.initMap();
            no.assetBundleManager.decRef(jsonAsset);
        });
    }

    private initMap() {
        this.delegate?.onInitMap(this.mapData);
        let layers = this.mapData.layerTypes || [];
        for (let i = 0, n = layers.length; i < n; i++) {
            this.delegate?.onInitObjects(layers[i], this.mapData.getLayerObjects(layers[i]));
        }
        if (!this?.node?.isValid) return;
        this.delegate?.onInitComplete();
    }
}
