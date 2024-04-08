
import {
    ccclass, property, menu, Component, Node,
    Asset, SpriteFrame, Material, Prefab, JsonAsset, Texture2D, SpriteAtlas, sys, Sprite
} from '../yj';
import { no } from '../no';
import { LoadAssetsInfo, SpriteFrameDataType } from '../types';
import { YJSetSample2DMaterial } from '../effect/YJSetSample2DMaterial';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { YJi18n } from '../base/YJi18n';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJRemotePackageDownloader } from '../network/YJRemotePackageDownloader';
import { resolve } from 'path';

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

    public set spriteFrame(v: SpriteFrame) {
        if (v) {
            this.assetUuid = v.uuid;
            this.assetName = v.name;
            this.setPath();
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
                    no.err(`需要手动添加相关的纹理：节点${a.node.name},bindKeys${a.bind_keys}`);
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

    @property
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

    private atlases: any[] = [];
    private textures: Texture2D[] = [];
    private materials: Material[] = [];

    onLoad() {
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
        let bundles: string[] = [], requests: { uuid?: string, path?: string, bundle?: string, type?: typeof Asset }[] = [];
        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            if (this.spriteFrameInfos[i].path) {
                const b = no.assetBundleManager.assetPath(this.spriteFrameInfos[i].path).bundle;
                no.addToArray(bundles, b);
            }
        }
        for (let i = 0, n = this.textureInfos.length; i < n; i++) {
            if (this.textureInfos[i].path) {
                const b = no.assetBundleManager.assetPath(this.textureInfos[i].path).bundle;
                no.addToArray(bundles, b);
            }
        }
        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            if (this.prefabInfos[i].path) {
                const b = no.assetBundleManager.assetPath(this.prefabInfos[i].path).bundle;
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
        if (bundles.length == 0) return;

        await this.loadBundles(bundles);

        let needCreateMaterial = true;

        if (this.materialInfos.length > 0) {
            const info = this.materialInfos[0];
            if (info.assetUuid) {
                needCreateMaterial = false;
                await this._loadMaterial(info.path);
            }
        }

        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            if (this.spriteFrameInfos[i].path) {
                const bundle = no.assetBundleManager.assetPath(this.spriteFrameInfos[i].path).bundle,
                    info: any = no.assetBundleManager.getBundle(bundle).getAssetInfo(this.spriteFrameInfos[i].assetUuid);
                requests[requests.length] = { path: info.path, bundle: bundle };
            } else
                requests[requests.length] = { uuid: this.spriteFrameInfos[i].assetUuid, type: SpriteFrame };
        }
        let atlasUuids: string[] = [];
        let textureUuids: string[] = [];
        for (let i = 0, n = this.textureInfos.length; i < n; i++) {
            atlasUuids[atlasUuids.length] = this.textureInfos[i].atlasJsonUuid;
            textureUuids[textureUuids.length] = this.textureInfos[i].assetUuid;
            if (this.textureInfos[i].path) {
                const bundle = no.assetBundleManager.assetPath(this.textureInfos[i].path).bundle;
                if (needCreateMaterial) {
                    const info1: any = no.assetBundleManager.getBundle(bundle).getAssetInfo(this.textureInfos[i].assetUuid);
                    requests[requests.length] = { path: info1.path, bundle: bundle };
                }
                const info2: any = no.assetBundleManager.getBundle(bundle).getAssetInfo(this.textureInfos[i].atlasJsonUuid);
                requests[requests.length] = { path: info2.path, bundle: bundle };
            } else {
                if (needCreateMaterial)
                    requests[requests.length] = { uuid: this.textureInfos[i].assetUuid, type: Texture2D };
                requests[requests.length] = { uuid: this.textureInfos[i].atlasJsonUuid, type: JsonAsset };
            }
        }
        for (let i = 0, n = this.prefabInfos.length; i < n; i++) {
            if (this.prefabInfos[i].path) {
                const bundle = no.assetBundleManager.assetPath(this.prefabInfos[i].path).bundle,
                    info: any = no.assetBundleManager.getBundle(bundle).getAssetInfo(this.prefabInfos[i].assetUuid);
                requests[requests.length] = { path: info.path, bundle: bundle };
            } else
                requests[requests.length] = { uuid: this.prefabInfos[i].assetUuid, type: Prefab };
        }

        if (requests.length > 0) {
            await this._loadTextures(requests, atlasUuids, textureUuids);
            if (this.loadLanguageBundle) {
                await this._loadLanguageBundle(atlasUuids, textureUuids, needCreateMaterial);
            }
        } else if (this.loadLanguageBundle) {
            await this._loadLanguageBundle(atlasUuids, textureUuids, needCreateMaterial);
        }
        if (needCreateMaterial)
            this.createMaterial();
        this.backgroundLoadInfos.forEach(info => {
            info.load();
        });
    }

    private async _loadMaterial(path: string) {
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadMaterial(path, item => {
                item['_yj_ref'] = (item['_yj_ref'] || 0) + 1;
                this.materials[this.materials.length] = item;
                this.setMaterialToDynamicAtlas(item);
                item['_props'].forEach(p => {
                    for (const key in p) {
                        const a = p[key];
                        if (a instanceof Texture2D) {
                            a['_yj_ref'] = (a['_yj_ref'] || 0) + 1;
                            this.textures[this.textures.length] = a;
                        }
                    }
                });
                resolve();
            });
        });
    }

    private async _loadTextures(requests: any[], atlasUuids: string[], textureUuids: string[]) {
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                items.forEach(item => {
                    const uuid = item.uuid;
                    let i = atlasUuids.indexOf(uuid);
                    if (i > -1) {
                        this.atlases[i] = (item as JsonAsset).json;
                        no.assetBundleManager.decRef(item);
                    } else {
                        i = textureUuids.indexOf(uuid);
                        if (i > -1) {
                            this.textures[i] = item as Texture2D;
                            item['_yj_ref'] = (item['_yj_ref'] || 0) + 1;
                        } else
                            no.assetBundleManager.decRef(item);
                    }
                });
                resolve();
            });
        });
    }

    private async _loadLanguageBundle(atlasUuids: string[], textureUuids: string[], needCreateMaterial: boolean) {
        if (sys.platform == sys.Platform.WECHAT_GAME) return;
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAllFilesInBundle(YJi18n.ins.language, [SpriteAtlas], null, items => {
                if (items) {
                    items.forEach(item => {
                        if (item instanceof JsonAsset && !atlasUuids.includes(item.uuid)) {
                            this.atlases[this.atlases.length] = item.json;
                            no.assetBundleManager.decRef(item);
                        } else if (item instanceof Texture2D && !textureUuids.includes(item.uuid)) {
                            this.textures[this.textures.length] = item;
                            item['_yj_ref'] = (item['_yj_ref'] || 0) + 1;
                            if (!needCreateMaterial) {
                                this.addTextureToMaterial(this.textures.length - 1);
                            }
                        } else no.assetBundleManager.decRef(item);
                    });
                }
                resolve();
            });
        });
    }

    private async loadBundles(bundles: string[]) {
        no.log('YJLoadAssets loadBundles', bundles);
        return new Promise<void>(resolve => {
            // no.assetBundleManager.loadBundles(bundles, p => {
            //     if (p >= 1) resolve();
            // });

            YJRemotePackageDownloader.new.loadBundles(bundles, p => {
                if (p >= 1) resolve();
            });
        });
    }

    private setMaterialToDynamicAtlas(material: Material) {
        const dynamic = this.getComponent(YJDynamicAtlas);
        dynamic.customMaterial = material;
        dynamic.setSubMaterial = true;
    }

    private createMaterial() {
        if (sys.platform == sys.Platform.WECHAT_GAME && sys.os == sys.OS.IOS) return;
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
            if (no.materialHasProperty(material, key)) {
                material.setProperty(key, this.textures[i], 0);
            }
        }
    }

    /**
     * 释放图集
     */
    public release() {
        this.spriteFrameInfos.forEach(info => {
            info.release && info.release(null);
        });
        this.textures.forEach(a => {
            if (sys.platform == sys.Platform.DESKTOP_BROWSER) {
                if (this.notRelease)
                    no.assetBundleManager.decRef(a);
                else if (--a['_yj_ref'] == 0)
                    no.assetBundleManager.release(a, true);
            } else no.assetBundleManager.decRef(a);
        });
        this.materials.forEach(a => {
            if (sys.platform == sys.Platform.DESKTOP_BROWSER) {
                if (this.notRelease)
                    no.assetBundleManager.decRef(a);
                else if (--a['_yj_ref'] == 0)
                    no.assetBundleManager.release(a, true);
            } else no.assetBundleManager.decRef(a);
        });
        this.textures.length = 0;
        this.atlases.length = 0;
        this.materials.length = 0;
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
}
