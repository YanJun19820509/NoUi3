
import { YJPreloadDelegate } from './YJPreloadDelegate';
import { ccclass, JsonAsset, property } from '../yj';
import { no } from '../no';
import { YJJobManager } from './YJJobManager';

@ccclass('YJPreloadJson')
export class YJPreloadJson extends YJPreloadDelegate {
    @property({ type: no.EventHandlerInfo, displayName: '加载完成' })
    completeCall: no.EventHandlerInfo[] = [];

    private _needAddJSONs: JsonAsset[] = [];
    onJsonLoaded(assets: JsonAsset[]) {
        this._needAddJSONs = assets;
        YJJobManager.ins.addTask(this.iterateNeedAddJSONs.bind(this));
    }

    private iterateNeedAddJSONs() {
        let asset: JsonAsset = this._needAddJSONs.shift();
        if (asset == undefined) {
            no.EventHandlerInfo.execute(this.completeCall);
            return true;
        }
        no.dataCache.setJSON({ [asset.name]: asset.json });
        asset.decRef();
        return false;
    }
}

