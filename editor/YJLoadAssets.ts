
import { _decorator, Component, Node, CCString, SpriteAtlas, Asset, SpriteFrame } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
const { ccclass, property, menu, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJLoadAssets
 * DateTime = Tue Mar 15 2022 18:48:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJLoadAssets.ts
 * FileBasenameNoExtension = YJLoadAssets
 * URL = db://assets/NoUi3/base/YJLoadAssets.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass("LoadAssetsInfo")
export class LoadAssetsInfo {
    @property
    assetUuid: string = '';

    constructor(uuid: string) {
        this.assetUuid = uuid;
    }

    public load(cb?: (asset: Asset) => void): void {
        no.assetBundleManager.loadByUuid<Asset>(this.assetUuid, Asset, file => {
            cb?.(file);
        });
    }

    public release(cb?: (asset: Asset) => void, force = false): void {
        let file = no.assetBundleManager.getAssetFromCache(this.assetUuid);
        if (file) {
            cb?.(file);
            no.assetBundleManager.release(file, force);
        }
    }

}

@ccclass('YJLoadAssets')
@menu('NoUi/editor/YJLoadAssets(资源加载与释放)')
@executeInEditMode()
export class YJLoadAssets extends Component {

    @property(LoadAssetsInfo)
    atlasInfos: LoadAssetsInfo[] = [];
    @property(LoadAssetsInfo)
    spriteFrameInfos: LoadAssetsInfo[] = [];

    onDestroy() {
        this.release();
    }

    public addAtlasUuid(uuid: string) {
        if (EDITOR) {
            let a = new LoadAssetsInfo(uuid);
            no.addToArray(this.atlasInfos, a, 'assetUuid');
        }
    }

    public addSpriteFrameUuid(uuid: string) {
        if (EDITOR) {
            let a = new LoadAssetsInfo(uuid);
            no.addToArray(this.spriteFrameInfos, a, 'assetUuid');
        }
    }

    /**
     * 加载图集
     */
    public async load() {
        if (EDITOR) return;
        this.spriteFrameInfos.forEach(info => {
            info.load();
        });
        let n = 0;
        this.atlasInfos.forEach(info => {
            info.load((file: SpriteAtlas) => {
                this.getComponent(YJDynamicAtlas)?.packAtlasToDynamicAtlas(file.getSpriteFrames());
                ++n;
            });
        });
        await no.waitFor(() => { return n == this.atlasInfos.length; });
    }

    /**
     * 释放图集
     */
    public release() {
        if (EDITOR) return;
        this.atlasInfos.forEach(info => {
            info.release((file: SpriteAtlas) => {
                let a = file.getSpriteFrames();
                a.forEach(sf => {
                    sf._resetDynamicAtlasFrame();
                });
            }, true);
        });
        this.spriteFrameInfos.forEach(info => {
            info.release(null, false);
        });
    }
}
