import { no } from "./no";
import { assetManager } from "./yj";

let oldAssets: any;

function start() {
    oldAssets = {};
    Object.keys(assetManager.assets['_map']).forEach(key => {
        let asset = assetManager.assets['_map'][key];
        oldAssets[key] = {
            _name: asset._name,
            _uuid: asset._uuid,
            _ref: asset._ref
        };
    });
}

function check(bundleName?: string) {
    let newAssets = {};
    Object.keys(assetManager.assets['_map']).forEach(key => {
        let asset = assetManager.assets['_map'][key];
        newAssets[key] = {
            _name: asset._name,
            _uuid: asset._uuid,
            _ref: asset._ref
        };
    });

    Object.keys(newAssets).forEach(key => {
        if (!oldAssets[key]) {
            if (!bundleName) {
                console.warn("新增资源未释放:", newAssets[key]);
            } else {
                let b = assetManager.getBundle(bundleName);
                if (b && b.getAssetInfo(newAssets[key]._uuid)) {
                    console.warn("新增SW资源未释放:", newAssets[key]);
                }
            }
        }
    });
}

no.addToWindowForDebug('assetsWatchStart', start);
no.addToWindowForDebug('assetsWatchCheck', check);