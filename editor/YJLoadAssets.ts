
import { _decorator, Component, Node, CCString, SpriteAtlas, Asset, SpriteFrame, Material, Prefab, macro } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
import { TimeWatcher } from '../TimeWatcher';
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
    @property({ readonly: true })
    assetName: string = '';

    constructor(uuid: string) {
        this.assetUuid = uuid;
    }

    public async load(): Promise<Asset> {
        let file = no.assetBundleManager.getAssetFromCache(this.assetUuid);
        if (file) {
            file.addRef();
            return file;
        } else
            return new Promise<Asset>(resolve => {
                no.assetBundleManager.loadByUuid<Asset>(this.assetUuid, Asset, file => {
                    resolve(file);
                });
            });
    }

    public release(cb?: (asset: Asset) => void): void {
        let file = no.assetBundleManager.getAssetFromCache(this.assetUuid);
        if (file) {
            cb?.(file);
            no.assetBundleManager.release(file);
        }
    }
}
@ccclass('SpriteAtlasInfo')
export class SpriteAtlasInfo extends LoadAssetsInfo {
    @property({ type: SpriteAtlas, editorOnly: true })
    atlas: SpriteAtlas = null;

    public check() {
        if (EDITOR) {
            if (this.atlas) {
                this.assetUuid = this.atlas._uuid;
                this.assetName = this.atlas.name;
                this.atlas = null;
            }
        }
    }
}
@ccclass('MaterialInfo')
export class MaterialInfo extends LoadAssetsInfo {
    @property({ type: Material, editorOnly: true })
    material: Material = null;

    public check() {
        if (EDITOR) {
            if (this.material) {
                this.assetUuid = this.material._uuid;
                this.assetName = this.material.name;
                this.material = null;
            }
        }
    }
}
@ccclass('SpriteFrameInfo')
export class SpriteFrameInfo extends LoadAssetsInfo {
    @property({ type: SpriteFrame, editorOnly: true })
    spriteFrame: SpriteFrame = null;

    public check() {
        if (EDITOR) {
            if (this.spriteFrame) {
                this.assetUuid = this.spriteFrame._uuid;
                this.assetName = this.spriteFrame.name;
                this.spriteFrame = null;
            }
        }
    }
}
@ccclass('PrefabInfo')
export class PrefabInfo extends LoadAssetsInfo {
    @property({ type: Prefab, editorOnly: true })
    prefab: Prefab = null;

    public check() {
        if (EDITOR) {
            if (this.prefab) {
                this.assetUuid = this.prefab._uuid;
                this.assetName = this.prefab.name;
                this.prefab = null;
            }
        }
    }
}

@ccclass('YJLoadAssets')
@menu('NoUi/editor/YJLoadAssets(资源加载与释放)')
@executeInEditMode()
export class YJLoadAssets extends Component {
    @property
    autoLoad: boolean = false;
    @property(MaterialInfo)
    materialInfos: MaterialInfo[] = [];
    @property(SpriteAtlasInfo)
    atlasInfos: SpriteAtlasInfo[] = [];
    @property(SpriteFrameInfo)
    spriteFrameInfos: SpriteFrameInfo[] = [];
    @property(PrefabInfo)
    prefabInfos: PrefabInfo[] = [];
    @property({ type: LoadAssetsInfo, tooltip: '可在panel创建完成后加载的资源' })
    backgroundLoadInfos: LoadAssetsInfo[] = [];
    @property({ editorOnly: true })
    doCheck: boolean = false;

    private atlases: SpriteAtlas[] = [];
    private _loaded: boolean = false;

    onLoad() {
        if (!EDITOR) {
            this.checkInfos = () => { };
            this.autoLoad && this.load();
        }
    }

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
        let requests: { uuid: string }[] = [];
        TimeWatcher.blink('start');
        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            requests[requests.length] = { uuid: this.spriteFrameInfos[i].assetUuid };
        }
        let atlasUuids: string[] = [];
        for (let i = 0, n = this.atlasInfos.length; i < n; i++) {
            atlasUuids[atlasUuids.length] = this.atlasInfos[i].assetUuid;
            requests[requests.length] = { uuid: this.atlasInfos[i].assetUuid };
        }
        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            requests[requests.length] = { uuid: this.prefabInfos[i].assetUuid };
        }
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                atlasUuids.forEach((uuid, i) => {
                    let item = no.itemOfArray(items, uuid, '_uuid');
                    this.atlases[i] = item as SpriteAtlas;
                });
                TimeWatcher.blink('end');
                this._loaded = true;
                resolve();
                this.backgroundLoadInfos.forEach(info => {
                    info.load();
                });
            });
        });
    }

    /**
     * 释放图集
     */
    public release() {
        if (EDITOR) return;
        this.atlasInfos.forEach(info => {
            info.release && info.release(null);
        });
        this.spriteFrameInfos.forEach(info => {
            info.release && info.release(null);
        });
    }


    /**
     * 从atlas中获取spriteFrame
     * @param name spriteFrame的名称
     * @returns [所属atlas下标，spriteFrame]
     */
    public async getSpriteFrameInAtlas(name: string): Promise<[number, SpriteFrame]> {
        await no.waitFor(() => { return this._loaded; }, this);
        let spriteFrame: SpriteFrame, idx: number;
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            const s = this.atlases[i].getSpriteFrame(name);
            if (s) {
                spriteFrame = s;
                idx = i;
                break;
            }
        }
        return [idx, spriteFrame];
    }

    private checkInfos() {
        if (!EDITOR) return;
        if (!this.doCheck) return;
        this.doCheck = false;
        this.atlasInfos.forEach(info => {
            info.check();
        });
        this.materialInfos.forEach(info => {
            info.check();
        });
        this.spriteFrameInfos.forEach(info => {
            info.check();
        });
        this.prefabInfos.forEach(info => {
            info.check();
        });
    }


    update() {
        this.checkInfos();
    }

    public static setLoadAsset(node: Node, loadAsset: YJLoadAssets): void {
        let bs: any[] = node.getComponentsInChildren('SetSpriteFrameInSampler2D');
        bs.forEach(b => {
            b.loadAsset = loadAsset;
        });
    }
}
