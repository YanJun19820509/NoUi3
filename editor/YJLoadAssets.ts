import {
    ccclass, property, menu, Component, Node,
    Asset, SpriteFrame, Material, Prefab, JsonAsset, Texture2D, SpriteAtlas, Sprite,
    ImageAsset
} from '../yj';
import { no } from '../no';
import { LoadAssetsInfo, SpriteFrameDataType } from '../types';
import { YJSetSample2DMaterial } from '../effect/YJSetSample2DMaterial';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { YJi18n } from '../base/YJi18n';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
// import { YJRemotePackageDownloader } from '../network/YJRemotePackageDownloader';
import { TimeWatcher } from '../TimeWatcher';
import { TextureInfoInGPU } from '../engine/TextureInfoInGPU';
import { YJTextureManager } from '../base/YJTextureManager';

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

@ccclass('JsonInfo')
export class JsonInfo extends LoadAssetsInfo {
    @property({ type: JsonAsset })
    public get json(): JsonAsset {
        return null;
    }

    public set json(v: JsonAsset) {
        if (v) {
            this.assetUuid = v.uuid;
            this.assetName = v.name;
        }
    }
}
@ccclass('TextureInfo')
export class TextureInfo extends LoadAssetsInfo {
    @property({ type: Texture2D })
    public get texture(): Texture2D {
        return null;
    }

    public set texture(v: Texture2D) {
        if (v) {
            this.addTexture(v.uuid);
        }
    }

    public addTexture(uuid: string) {
        this.assetUuid = uuid;
        no.assetBundleManager.getAssetInfoWithUuidInEditorMode(this.assetUuid, info => {
            this.path = info.path;
            this.assetName = info?.displayName;
            let path = info?.path.replace('/texture', '_atlas.json');
            if (path) {
                no.assetBundleManager.loadFileInEditorMode<JsonAsset>(path, JsonAsset, (file, info) => {
                    this.atlasJsonName = info.name;
                    this.atlasJsonUuid = info.uuid;
                });
            }
        });
    }
    @property({ readonly: true })
    atlasJsonUuid: string = '';
    @property({ readonly: true })
    atlasJsonName: string = '';

}
@ccclass('MaterialInfo')
export class MaterialInfo extends LoadAssetsInfo {
    @property({ type: Material })
    public get material(): Material {
        return null;
    }

    public set material(v: Material) {
        if (v) {
            this.assetUuid = v.uuid;
            this.assetName = v.name;
            this.setPath();
        }
    }

    public addMaterial(uuid: string) {
        this.assetUuid = uuid;
        this.setPath();
    }
}
@ccclass('SpriteFrameInfo')
export class SpriteFrameInfo extends LoadAssetsInfo {
    @property({ type: SpriteFrame })
    public get spriteFrame(): SpriteFrame {
        return null;
    }

    public set spriteFrame(v: SpriteFrame) {
        if (v) {
            this.assetUuid = v.uuid;
            this.assetName = v.name;
            this.setPath();
        }
    }

    public setPath() {
        if (!this.assetUuid) {
            this.path = '';
            this.assetName = '';
            this.assetUuid = '';
        } else {
            no.assetBundleManager.getAssetInfoWithUuidInEditorMode(this.assetUuid, info => {
                const a = info.path.split('/');
                this.assetName = a[a.length - 2];
                this.path = info?.path;
            });
        }
    }

    public addSpriteFrame(uuid: string) {
        this.assetUuid = uuid;
        this.setPath();
    }
}
@ccclass('PrefabInfo')
export class PrefabInfo extends LoadAssetsInfo {
    @property({ type: Prefab })
    public get prefab(): Prefab {
        return null;
    }

    public set prefab(v: Prefab) {
        if (v) {
            this.assetUuid = v.uuid;
            this.assetName = v.name;
        }
    }

    public addPrefab(url: string) {
        this.path = url;
        this.setUuid();
    }
}

const LanguageBundleMap: Map<string, [Texture2D, any]> = new Map();

@ccclass('YJLoadAssets')
@menu('NoUi/editor/YJLoadAssets(资源加载与释放)')
export class YJLoadAssets extends Component {
    @property
    autoLoad: boolean = false;
    @property({ displayName: '加载语言包', tooltip: '语言包需要以YJi18n中的语言标志命名' })
    loadLanguageBundle: boolean = true;
    @property({ type: no.EventHandlerInfo, visible() { return this.autoLoad; } })
    onLoaded: no.EventHandlerInfo[] = [];
    @property({ displayName: '不主动释放资源' })
    notRelease: boolean = false;
    @property(TextureInfo)
    textureInfos: TextureInfo[] = [];
    @property
    public get getTexturePath(): boolean {
        return false
    }

    public set getTexturePath(v: boolean) {
        this.textureInfos.forEach(info => {
            info.setPath();
        });
    }
    @property(SpriteFrameInfo)
    spriteFrameInfos: SpriteFrameInfo[] = [];
    @property(PrefabInfo)
    prefabInfos: PrefabInfo[] = [];
    @property({ type: LoadAssetsInfo, tooltip: '可在panel创建完成后加载的资源' })
    backgroundLoadInfos: LoadAssetsInfo[] = [];
    @property(MaterialInfo)
    materialInfos: MaterialInfo[] = [];
    @property
    public get autoSetSubLoadAsset(): boolean {
        return false;
    }

    public set autoSetSubLoadAsset(v: boolean) {
        if (v) YJLoadAssets.setLoadAsset(this.node, this);
    }
    @property
    public get getAllAssets(): boolean {
        return false;
    }

    public set getAllAssets(v: boolean) {
        const list: any = this.getComponentsInChildren('SetSpriteFrameInSampler2D'),
            textureUuid: string[] = [],
            spriteFrameUuid: string[] = [];
        list.forEach(a => {
            if (a.loadFromAtlas) {
                const sf = a.getComponent(Sprite).spriteFrame;
                if (sf) {
                    let uuid = sf.texture.uuid;
                    no.addToArray(textureUuid, uuid);
                } else {
                    no.warn(`需要手动添加相关的纹理：节点${a.node.name},bindKeys${a.bind_keys}`);
                }
            } else if (a.defaultSpriteFrameUuid)
                no.addToArray(spriteFrameUuid, a.defaultSpriteFrameUuid);
        });
        this.textureInfos.length = 0;
        textureUuid.forEach(uuid => {
            const info = new TextureInfo();
            info.addTexture(uuid);
            this.textureInfos[this.textureInfos.length] = info;
        });
        this.spriteFrameInfos.length = 0;
        spriteFrameUuid.forEach(uuid => {
            const info = new SpriteFrameInfo();
            info.addSpriteFrame(uuid);
            this.spriteFrameInfos[this.spriteFrameInfos.length] = info;
        });

        const list1 = this.getComponentsInChildren(YJLoadPrefab);
        this.prefabInfos.length = 0;
        list1.forEach(a => {
            const info = new PrefabInfo();
            info.addPrefab(a.prefabUrl);
            this.prefabInfos[this.prefabInfos.length] = info;
        });
    }

    @property({ visible() { return false; } })
    public get setMaterial(): boolean {
        return false;
    }

    public set setMaterial(v: boolean) {
        let uuids: string[] = [];
        this.textureInfos.forEach(info => {
            uuids[uuids.length] = info.assetUuid;
        })
        this.getComponent(YJDynamicAtlas).setMaterialTextures(uuids);

        const dynamicAtlas = this.getComponent(YJDynamicAtlas);
        if (dynamicAtlas.customMaterial) {
            const info = new MaterialInfo();
            info.addMaterial(dynamicAtlas.customMaterial.uuid);
            this.materialInfos[0] = info;
        }
    }


    private static TextureAllSize: number = 0;

    private atlases: any[] = [];
    private textures: Texture2D[] = [];
    private materials: Material[] = [];
    private spriteFrameMap: any = {};

    onLoad() {
        this.setPanelNameToSubNode();
        this.autoLoad &&
            this.load().then(() => {
                no.EventHandlerInfo.execute(this.onLoaded);
            });
    }

    onDestroy() {
        this.release();
    }

    /**
     * 加载图集
     */
    public async load() {
        let bundles: string[] = [],
            requests: { uuid?: string, path?: string, bundle?: string, type?: typeof Asset | typeof ImageAsset }[] = [];
        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            if (this.spriteFrameInfos[i].path) {
                const b = no.assetBundleManager.assetPath(this.spriteFrameInfos[i].path).bundle;
                no.addToArray(bundles, b);
            }
        }
        for (let i = 0, n = this.textureInfos.length; i < n; i++) {
            const textureInfo = this.textureInfos[i];
            if (textureInfo.path) {
                const b = no.assetBundleManager.assetPath(textureInfo.path).bundle;
                no.addToArray(bundles, b);
            }
        }
        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            const prefabInfo = this.prefabInfos[i];
            if (prefabInfo.path) {
                const b = no.assetBundleManager.assetPath(prefabInfo.path).bundle;
                no.addToArray(bundles, b);
            }
        }
        for (let i = 0, n = this.materialInfos.length; i < n; i++) {
            if (this.materialInfos[i].path) {
                const b = no.assetBundleManager.assetPath(this.materialInfos[i].path).bundle;
                no.addToArray(bundles, b);
            }
        }

        if (this.loadLanguageBundle) no.addToArray(bundles, YJi18n.ins.language);
        // if (bundles.length == 0) return;
        if (bundles.length > 0)
            await this.loadBundles(bundles);

        // if (this.materialInfos.length > 0) {
        //     const r: any[] = [];
        //     for (let i = 0, n = this.materialInfos.length; i < n; i++) {
        //         const materialInfo = this.materialInfos[i],
        //             bundle = no.assetBundleManager.assetPath(materialInfo.path).bundle,
        //             a: any = no.assetBundleManager.getLoadedBundle(bundle).getAssetInfo(materialInfo.assetUuid);
        //         r[r.length] = { path: a.path, bundle: bundle, type: Material };
        //     }
        //     await this._loadMaterial(r);
        // }
        let textureIdx: any = {}, jsonIdx: any = {};
        for (let i = 0, n = this.textureInfos.length; i < n; i++) {
            const textureInfo = this.textureInfos[i];
            const assetUuid = textureInfo.assetUuid.split('@')[0];
            if (YJTextureManager.hasTexture(assetUuid)) {
                this.textures[this.textures.length] = YJTextureManager.getTexture(assetUuid);
            } else {
                if (textureInfo.path) {
                    const bundle = no.assetBundleManager.assetPath(textureInfo.path).bundle;
                    const info1: any = no.assetBundleManager.getLoadedBundle(bundle).getAssetInfo(assetUuid);
                    requests[requests.length] = { path: info1.path, bundle: bundle, type: ImageAsset };
                } else {
                    requests[requests.length] = { uuid: assetUuid, type: ImageAsset };
                }
                this.textures[this.textures.length] = null;
                textureIdx[assetUuid] = this.textures.length - 1;
            }
            const atlasJson = this.getAtlasJson(textureInfo.atlasJsonUuid);
            if (atlasJson != null) {
                this.atlases[this.atlases.length] = atlasJson;
            } else {
                if (textureInfo.path) {
                    const bundle = no.assetBundleManager.assetPath(textureInfo.path).bundle;
                    const info2: any = no.assetBundleManager.getLoadedBundle(bundle).getAssetInfo(textureInfo.atlasJsonUuid);
                    requests[requests.length] = { path: info2.path, bundle: bundle, type: JsonAsset };
                } else {
                    requests[requests.length] = { uuid: textureInfo.atlasJsonUuid, type: JsonAsset };
                }
                this.atlases[this.atlases.length] = null;
                jsonIdx[textureInfo.atlasJsonUuid] = this.atlases.length - 1;
            }
        }

        if (requests.length > 0) {
            await this._loadFiles(requests, textureIdx, jsonIdx);
        }
        if (this.loadLanguageBundle) {
            await this._loadLanguageBundle();
        }
        this.createMaterial();

        Promise.resolve();

        requests.length = 0; // clear requests

        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            const spriteFrameInfo = this.spriteFrameInfos[i];
            if (spriteFrameInfo.path) {
                const bundle = no.assetBundleManager.assetPath(spriteFrameInfo.path).bundle,
                    info: any = no.assetBundleManager.getLoadedBundle(bundle).getAssetInfo(spriteFrameInfo.assetUuid);
                requests[requests.length] = { path: info.path, bundle: bundle, type: SpriteFrame };
            } else
                requests[requests.length] = { uuid: spriteFrameInfo.assetUuid, type: SpriteFrame };
        }

        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            const prefabInfo = this.prefabInfos[i];
            if (prefabInfo.path) {
                const bundle = no.assetBundleManager.assetPath(prefabInfo.path).bundle,
                    info: any = no.assetBundleManager.getLoadedBundle(bundle).getAssetInfo(prefabInfo.assetUuid);
                requests[requests.length] = { path: info.path, bundle: bundle, type: Prefab };
            } else
                requests[requests.length] = { uuid: prefabInfo.assetUuid, type: Prefab };
        }
        if (requests.length > 0)
            no.assetBundleManager.preloadAny(requests, null);
        this.backgroundLoadInfos.forEach(info => {
            info.load();
        });
    }

    private async _loadMaterial(requests: any[]) {
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnyFiles(requests, null, items => {
                items.forEach(item => {
                    item['_yj_ref'] = (item['_yj_ref'] || 0) + 1;
                    this.materials[this.materials.length] = item as Material;
                });
                resolve();
            });
        });
    }

    private async _loadFiles(requests: any[], textureIdx: any, jsonIdx: any) {
        return new Promise<void>(resolve => {
            TimeWatcher.blink(`_loadFiles1 ${this.node.name}`)
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                TimeWatcher.blink(`_loadFiles2 ${this.node.name}`)
                items.forEach(item => {
                    if (item instanceof JsonAsset) {
                        this.setAtlasJson(item.uuid, item.json)
                        const i = jsonIdx[item.uuid];
                        if (i != null)
                            this.atlases[i] = item.json;
                        else
                            this.atlases[this.atlases.length] = item.json;
                        no.assetBundleManager.decRef(item);
                    } else if (item instanceof ImageAsset) {
                        no.assetBundleManager.cacheImage(item);
                        const t = YJTextureManager.getTexture(item.uuid);
                        const i = textureIdx[item.uuid];
                        if (i != null)
                            this.textures[i] = t;
                        else
                            this.textures[this.textures.length] = t;
                        TextureInfoInGPU.addTextureUuidToPanel(item.uuid, this.node.name);
                    }
                });
                resolve();
            });
        });
    }

    private async _loadLanguageBundle() {
        const lan = YJi18n.ins.language;
        if (this.hasLanguage(lan)) {
            this.atlases[this.atlases.length] = this.getLanguageJson(lan);
            this.textures[this.textures.length] = this.getLanguageTexture(lan);
            return;
        }
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAllFilesInBundle(lan, [SpriteAtlas, SpriteFrame, ImageAsset], null, items => {
                if (items) {
                    items.forEach(item => {
                        if (item instanceof JsonAsset) {
                            this.atlases[this.atlases.length] = item.json;
                            no.assetBundleManager.decRef(item);
                        } else if (item instanceof Texture2D) {
                            this.textures[this.textures.length] = item;
                        }
                    });
                    this.addLanguage(lan, this.textures[this.textures.length - 1], this.atlases[this.atlases.length - 1]);
                }
                resolve();
            });
        });
    }

    private async loadBundles(bundles: string[]) {
        no.log('YJLoadAssets loadBundles', bundles);
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadBundles(bundles, p => {
                if (p >= 1) resolve();
            });

            // YJRemotePackageDownloader.new.loadBundles(bundles, p => {
            //     if (p >= 1) {
            //         resolve();
            //     }
            // });
        });
    }

    private setMaterialToDynamicAtlas(material: Material) {
        const dynamic = this.getComponent(YJDynamicAtlas);
        dynamic.customMaterial = material;
        dynamic.setSubMaterial = true;
    }

    private createMaterial() {
        const ssm = this.getComponent(YJSetSample2DMaterial);
        if (ssm && ssm.enabled && this.textures.length) {
            ssm.setAtlases(this.textures);
            this.setMaterialToDynamicAtlas(ssm.material);
        }
    }

    private addTextureToMaterial(i: number) {
        const material = this.getComponent(YJDynamicAtlas).customMaterial;
        if (material) {
            const key = `atlas${i}`;
            if (no.materialHasProperty(material, 0, 0, key)) {
                material.setProperty(key, this.textures[i], 0);
            } else {
                no.warn(`YJLoadAssets addTextureToMaterial key(${key}) 不存在！`)
            }
        }
    }

    /**
     * 释放图集
     */
    public release() {
        if (no.isDebug()) {
            if (this._usedAtlasIndexs.length < this.atlases.length) {
                for (let i = 0, n = this.atlases.length; i < n; i++) {
                    if (this._usedAtlasIndexs.indexOf(i) == -1) {
                        no.err(`${this.node.name}可能加载了未被使用的图集 ${this.textureInfos[i]?.assetName || YJi18n.ins.language}，请检查`);
                    }
                }
            }
        }
        this.spriteFrameInfos.forEach(info => {
            info.release && info.release(null);
        });
        this.textures.forEach(a => {
            YJTextureManager.returnTexture(a.uuid);
        });
        // this.materials.forEach(a => {
        //     if (sys.platform == sys.Platform.DESKTOP_BROWSER) {
        //         if (this.notRelease)
        //             no.assetBundleManager.decRef(a);
        //         else if (--a['_yj_ref'] == 0)
        //             no.assetBundleManager.release(a, true);
        //     } else no.assetBundleManager.decRef(a);
        // });
        this.textures.length = 0;
        this.atlases.length = 0;
        this.materials.length = 0;
        this.spriteFrameMap = {};
        const name = this.node.name;
        no.setTimeoutF(() => {
            TextureInfoInGPU.showTextureWhenPanelDestroy(name);
        }, 500);

    }


    private _usedAtlasIndexs: number[] = []; // 记录已经使用的图集下标
    /**
     * 从spriteframe的数据文件中获取spriteFrameInfo
     * @param name spriteFrame的名称
     * @returns [所属atlas下标，SpriteFrameInfo]
     */
    public getSpriteFrameInAtlas(name: string): [number, SpriteFrameDataType] {
        let a = this.spriteFrameMap[name];
        if (a) return a;
        let info: SpriteFrameDataType, idx: number;
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            const s = this.atlases[i][name];
            if (s) {
                info = s;
                idx = i;
                break;
            }
        }
        a = [idx, info];
        this.spriteFrameMap[name] = a;
        no.addToArray(this._usedAtlasIndexs, idx);
        return a;
    }

    public getSpriteFrame(name: string, cb: (sf: SpriteFrame) => void) {
        let info: SpriteFrameDataType;
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            const s = this.atlases[i][name];
            if (s) {
                info = s;
                break;
            }
        }
        if (info)
            no.assetBundleManager.loadByUuid(info.uuid, SpriteFrame, cb);
        else cb?.(null);
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

    private getAtlasJson(uuid: string): any | null {
        return no.assetBundleManager.getCachedAtlasJson(uuid) || null;
    }

    private setAtlasJson(uuid: string, json: any): void {
        no.assetBundleManager.cacheAsset(uuid, json)
    }

    private hasLanguage(name: string): boolean {
        return LanguageBundleMap.has(name);
    }

    private getLanguageTexture(name: string): Texture2D {
        return LanguageBundleMap.get(name)[0];
    }

    private getLanguageJson(name: string): any | null {
        return LanguageBundleMap.get(name)[1];
    }

    private addLanguage(name: string, texture: Texture2D, json: any): void {
        LanguageBundleMap.set(name, [texture, json]);
    }

    private setPanelNameToSubNode() {
        if (TextureInfoInGPU.isWork) {
            const arr = [].concat(this.getComponentsInChildren('SetSpriteFrameInSampler2D'), this.getComponentsInChildren('YJCharLabel')),
                name = this.node.name;
            arr.forEach(item => item.panelName = name);
        }
    }
}
