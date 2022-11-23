
import { _decorator, Component, Node, CCString, SpriteAtlas, Asset, SpriteFrame, Material, Prefab, macro } from 'cc';
import { EDITOR } from 'cc/env';
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
    @property({ displayName: '强制释放' })
    forceRelease: boolean = false;

    constructor(uuid: string) {
        this.assetUuid = uuid;
    }

    public async load(): Promise<Asset> {
        let file = no.assetBundleManager.getAssetFromCache(this.assetUuid);
        if (file) {
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
            no.assetBundleManager.release(file, this.forceRelease);
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
        let all = this.spriteFrameInfos.length + this.atlasInfos.length + this.prefabInfos.length;
        let an = 0;
        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            await this.spriteFrameInfos[i].load();
            ++an;
        }
        for (let i = 0, n = this.atlasInfos.length; i < n; i++) {
            let f = await this.atlasInfos[i].load();
            this.atlases[i] = f as SpriteAtlas;
            ++an;
        }
        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            await this.prefabInfos[i].load();
            ++an;
        }
        await no.waitFor(() => { return an == all; }, this);
        this._loaded = true;
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
