
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
        let file = no.assetBundleManager.getAssetFromCache(this.assetUuid);
        if (file) {
            cb?.(file);
        } else
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
    @property(LoadAssetsInfo)
    prefabInfos: LoadAssetsInfo[] = [];
    @property({ type: LoadAssetsInfo, tooltip: '可在panel创建完成后加载的资源' })
    backgroundLoadInfos: LoadAssetsInfo[] = [];
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

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
        let all = this.spriteFrameInfos.length + this.atlasInfos.length + this.prefabInfos.length;
        let n = 0;
        this.spriteFrameInfos.forEach(info => {
            info.load(() => {
                ++n;
            });
        });
        this.atlasInfos.forEach(info => {
            info.load((file: SpriteAtlas) => {
                let t = file.getTexture();
                if (t.width <= 1000 && t.height <= 1000) {
                    let dynamicAtlas = this.dynamicAtlas || this.getComponent(YJDynamicAtlas);
                    dynamicAtlas?.packAtlasToDynamicAtlas(file);
                }
                ++n;
            });
        });
        this.prefabInfos.forEach(info => {
            info.load(() => {
                ++n;
            });
        });
        await no.waitFor(() => { return n == all; }, this);
        this.backgroundLoadInfos.forEach(info => {
            info.load();
        });
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
            info.release(null, true);
        });
    }

}
