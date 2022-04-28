
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

@ccclass('YJLoadAssets')
@menu('NoUi/editor/YJLoadAssets(资源加载与释放)')
@executeInEditMode()
export class YJLoadAssets extends Component {
    @property
    atlasUuids: string[] = [];
    @property
    spriteFrameUuids: string[] = [];

    private assets: Asset[];

    onDestroy() {
        this.release();
    }

    public addAtlasUuid(uuid: string) {
        if (EDITOR)
            no.addToArray(this.atlasUuids, uuid);
    }

    public addSpriteFrameUuid(uuid: string) {
        if (EDITOR)
            no.addToArray(this.spriteFrameUuids, uuid);
    }

    /**
     * 加载图集
     */
    public async load() {
        if (EDITOR) return;
        this.assets = [];
        this.atlasUuids.forEach(uuid => {
            no.assetBundleManager.loadByUuid<SpriteAtlas>(uuid, SpriteAtlas, (file) => {
                this.assets[this.assets.length] = file;
                this.getComponent(YJDynamicAtlas)?.packAtlasToDynamicAtlas(file.getSpriteFrames());
            });
        });
        await no.waitFor(() => { return this.assets.length == this.atlasUuids.length; });
        this.spriteFrameUuids.forEach(uuid => {
            no.assetBundleManager.loadByUuid(uuid, SpriteFrame, (file) => {
                this.assets[this.assets.length] = file;
            });
        });
    }

    /**
     * 释放图集
     */
    public release() {
        if (EDITOR) return;
        this.assets?.forEach(asset => {
            asset.decRef();
        });
        this.assets = [];
    }
}
