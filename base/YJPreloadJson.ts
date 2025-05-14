
import { YJPreloadDelegate } from './YJPreloadDelegate';
import { ccclass, JsonAsset } from '../yj';
import { no } from '../no';
import { YJJobManager } from './YJJobManager';

@ccclass('YJPreloadJson')
export class YJPreloadJson extends YJPreloadDelegate {
    private _needAddJSONs: JsonAsset[] = [];
    onJsonLoaded(assets: JsonAsset[]) {
        this._needAddJSONs = assets;
        YJJobManager.ins.addTask(this.iterateNeedAddJSONs.bind(this));
    }

    private iterateNeedAddJSONs() {
        let asset: JsonAsset = this._needAddJSONs.shift();
        if (asset == undefined) {
            return true;
        }
        no.dataCache.setJSON({ [asset.name]: asset.json });
        asset.decRef();
        return false;
    }
}

