
import { _decorator, Component, Node, CCString, SpriteAtlas, Asset, SpriteFrame, Material, Prefab, macro, JsonAsset } from 'cc';
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
    @property({})
    assetUrl: string = '';
    @property({})
    assetName: string = '';
    @property({})
    assetPath: string = '';

    private _uuid: string;

    constructor(url?: string) {
        this.assetUrl = url;
    }

    public async load(): Promise<Asset> {
        const path = this.path;
        this._uuid = no.assetBundleManager.getUuidFromPath(path);
        let file = no.assetBundleManager.getAssetFromCache(this._uuid);
        if (file) {
            file.addRef();
            return file;
        } else
            return new Promise<Asset>(resolve => {
                no.assetBundleManager.loadByPath<Asset>(path, Asset, file => {
                    resolve(file);
                });
            });
    }

    public release(cb?: (asset: Asset) => void): void {
        let file = no.assetBundleManager.getAssetFromCache(this._uuid);
        if (file) {
            cb?.(file);
            no.assetBundleManager.release(file);
        }
    }

    public get path(): string {
        return this.assetPath.replace('db://assets/', '');
    }

    public get url(): string {
        return this.assetUrl.replace('db://assets/', '');
    }
}
@ccclass('JsonInfo')
export class JsonInfo extends LoadAssetsInfo {
    @property({ type: JsonAsset, editorOnly: true })
    json: JsonAsset = null;

    public check() {
        if (EDITOR) {
            if (this.json) {
                const name = this.json.name;
                no.assetBundleManager.getAssetInfoWithNameInEditorMode(`${name}.json`, JsonAsset).then(info => {
                    this.assetPath = info.path;
                    this.assetUrl = info.url;
                });
                this.assetName = name;
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
                const name = this.material.name;
                no.assetBundleManager.getAssetInfoWithNameInEditorMode(`${name}.mtl`, Material).then(info => {
                    this.assetPath = info.path;
                    this.assetUrl = info.url;
                });
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
                const name = this.spriteFrame.name;
                no.assetBundleManager.getAssetInfoWithNameInEditorMode(`${name}`, SpriteFrame).then(info => {
                    this.assetPath = info.path;
                    this.assetUrl = info.url;
                });
                this.assetName = name;
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
                const name = this.prefab.name;
                no.assetBundleManager.getAssetInfoWithNameInEditorMode(`${name}.prefab`, Prefab).then(info => {
                    this.assetPath = info.path;
                    this.assetUrl = info.url;
                });
                this.assetName = name;
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
            this.autoLoad && this.load();
        }
    }

    onDestroy() {
        this.release();
    }

    public addAtlasUuid(uuid: string) {
        if (EDITOR) {
            let a = new LoadAssetsInfo(uuid);
            no.addToArray(this.jsonInfos, a, 'assetPath');
        }
    }

    public addSpriteFrameUuid(uuid: string) {
        if (EDITOR) {
            let a = new LoadAssetsInfo(uuid);
            no.addToArray(this.spriteFrameInfos, a, 'assetPath');
        }
    }

    /**
     * 加载图集
     */
    public async load() {
        if (EDITOR) return;
        let requests: { path: string, type: typeof Asset, bundle: string }[] = [];
        // for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
        //     requests[requests.length] = { path: this.spriteFrameInfos[i].path, ext: SpriteFrame };
        // }
        let atlasNames: string[] = [];
        for (let i = 0, n = this.jsonInfos.length; i < n; i++) {
            const info = this.jsonInfos[i];
            const p = no.assetBundleManager.assetPath(info.url);
            atlasNames[atlasNames.length] = p.file;
            requests[requests.length] = { path: p.path, type: p.type, bundle: p.bundle };
        }
        // for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
        //     requests[requests.length] = { path: this.prefabInfos[i].path, type: Prefab };
        // }
        if (requests.length == 0) return;
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                atlasNames.forEach((name, i) => {
                    let item: JsonAsset = no.itemOfArray(items, name, 'name');
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
        if (!node) return;
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
