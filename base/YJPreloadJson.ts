
import { YJPreloadDelegate } from './YJPreloadDelegate';
import { ccclass, JsonAsset, property } from '../yj';
import { no } from '../no';

@ccclass('YJPreloadJson')
export class YJPreloadJson extends YJPreloadDelegate {
    @property({ type: no.EventHandlerInfo, displayName: '加载完成' })
    completeCall: no.EventHandlerInfo[] = [];

    onJsonLoaded(assets: JsonAsset[], next?: Function) {
        let asset: JsonAsset;
        for (let i = 0, n = assets.length; i < n; i++) {
            asset = assets[i];
            no.dataCache.setJSON({ [asset.name]: asset.json });
            no.log(asset.name);
            asset.decRef();
        }
        no.EventHandlerInfo.execute(this.completeCall);
        next?.();
    }
}

