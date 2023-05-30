
import { _decorator, Component, Node, Asset, SpriteFrame, Material, Prefab, JsonAsset } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
import { SpriteFrameDataType } from '../types';
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
@ccclass('JsonInfo')
export class JsonInfo extends LoadAssetsInfo {
    @property({ type: JsonAsset, editorOnly: true })
    json: JsonAsset = null;

    public check() {
        if (EDITOR) {
            if (this.json) {
                this.assetUuid = this.json._uuid;
                this.assetName = this.json.name;
                this.json = null;
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
    @property({ type: no.EventHandlerInfo, visible() { return this.autoLoad; } })
    onLoaded: no.EventHandlerInfo[] = [];
    @property(MaterialInfo)
    materialInfos: MaterialInfo[] = [];
    @property(JsonInfo)
    jsonInfos: JsonInfo[] = [];
    @property(SpriteFrameInfo)
    spriteFrameInfos: SpriteFrameInfo[] = [];
    @property(PrefabInfo)
    prefabInfos: PrefabInfo[] = [];
    @property({ type: LoadAssetsInfo, tooltip: '可在panel创建完成后加载的资源' })
    backgroundLoadInfos: LoadAssetsInfo[] = [];
    @property({ editorOnly: true })
    doCheck: boolean = false;
    @property
    autoSetSubLoadAsset: boolean = false;

    private atlases: any[] = [];
    private _loaded: boolean = false;

    onLoad() {
        if (!EDITOR) {
            this.checkInfos = () => { };
            this.autoLoad &&
                this.load().then(() => {
                    no.EventHandlerInfo.execute(this.onLoaded);
                });
        }
    }

    onDestroy() {
        this.release();
    }

    public addAtlasUuid(uuid: string) {
        if (EDITOR) {
            let a = new LoadAssetsInfo(uuid);
            no.addToArray(this.jsonInfos, a, 'assetUuid');
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
        let requests: { uuid: string, type: typeof Asset }[] = [];
        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            requests[requests.length] = { uuid: this.spriteFrameInfos[i].assetUuid, type: SpriteFrame };
        }
        let atlasUuids: string[] = [];
        for (let i = 0, n = this.jsonInfos.length; i < n; i++) {
            atlasUuids[atlasUuids.length] = this.jsonInfos[i].assetUuid;
            requests[requests.length] = { uuid: this.jsonInfos[i].assetUuid, type: JsonAsset };
        }
        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            requests[requests.length] = { uuid: this.prefabInfos[i].assetUuid, type: Prefab };
        }
        if (requests.length == 0) return;
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                if (!this?.isValid) {
                    return;
                }
                atlasUuids.forEach((uuid, i) => {
                    let item: JsonAsset = no.itemOfArray(items, uuid, '_uuid');
                    this.atlases[i] = item.json;
                });
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
        this.spriteFrameInfos.forEach(info => {
            info.release && info.release(null);
        });
    }


    /**
     * 从spriteframe的数据文件中获取spriteFrameInfo
     * @param name spriteFrame的名称
     * @returns [所属atlas下标，SpriteFrameInfo]
     */
    public getSpriteFrameInAtlas(name: string): [number, SpriteFrameDataType] {
        let info: SpriteFrameDataType, idx: number;
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            const s = this.atlases[i][name];
            if (s) {
                info = s;
                idx = i;
                break;
            }
        }
        return [idx, info];
    }

    private checkInfos() {
        if (!EDITOR) return;
        if (!this.doCheck) return;
        this.doCheck = false;
        this.jsonInfos.forEach(info => {
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
        if (EDITOR) {
            if (this.autoSetSubLoadAsset) {
                this.autoSetSubLoadAsset = false;
                YJLoadAssets.setLoadAsset(this.node, this);
            }
        }
    }

    public static setLoadAsset(node: Node, loadAsset: YJLoadAssets): void {
        let bs: any[] = [].concat(node.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            node.getComponentsInChildren('SetCreateNode'),
            node.getComponentsInChildren('SetList'),
            node.getComponentsInChildren('SetCreateNodeByUrl')
        );
        bs.forEach(b => {
            b.loadAsset = loadAsset;
        });
    }
}
