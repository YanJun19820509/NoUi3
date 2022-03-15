
import { _decorator, Component, Node, CCString, SpriteAtlas, Asset } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
const { ccclass, property, menu, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJAtlasManager
 * DateTime = Tue Mar 15 2022 18:48:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAtlasManager.ts
 * FileBasenameNoExtension = YJAtlasManager
 * URL = db://assets/NoUi3/base/YJAtlasManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJAtlasManager')
@menu('NoUi/editor/YJAtlasManager(图集加载与释放)')
@executeInEditMode()
export class YJAtlasManager extends Component {
    @property
    atlasUuids: string[] = [];

    private assets: Asset[];

    onDestroy() {
        this.releaseAtlas();
    }

    public addAtlasUuid(uuid: string) {
        if (EDITOR)
            this.atlasUuids[this.atlasUuids.length] = uuid;
    }

    /**
     * 加载图集
     */
    public loadAtlas() {
        if (EDITOR) return;
        this.assets = [];
        this.atlasUuids.forEach(uuid => {
            no.assetBundleManager.loadByUuid(uuid, SpriteAtlas, (file) => {
                this.assets[this.assets.length] = file;
            });
        });
    }

    /**
     * 释放图集
     */
    public releaseAtlas() {
        if (EDITOR) return;
        this.assets.forEach(asset => {
            asset.decRef();
        });
        this.assets = [];
    }
}
