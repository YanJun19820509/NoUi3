
import {
    ccclass, property, menu, executeInEditMode, Component, Node,
    Asset, SpriteFrame, Material, Prefab, JsonAsset, Texture2D, SpriteAtlas, sys
} from '../yj';
import { no } from '../no';
import { LoadAssetsInfo, SpriteFrameDataType } from '../types';
import { YJSetSample2DMaterial } from '../effect/YJSetSample2DMaterial';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { YJi18n } from '../base/YJi18n';

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
            this.assetUuid = v.uuid;
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
        }
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
        }
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
}

@ccclass('YJLoadAssets')
@menu('NoUi/editor/YJLoadAssets(资源加载与释放)')
@executeInEditMode()
export class YJLoadAssets extends Component {
    @property
    autoLoad: boolean = false;
    @property({ displayName: '加载语言包', tooltip: '语言包需要以YJi18n中的语言标志命名' })
    loadLanguageBundle: boolean = true;
    @property({ type: no.EventHandlerInfo, visible() { return this.autoLoad; } })
    onLoaded: no.EventHandlerInfo[] = [];
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
    @property
    public get autoSetSubLoadAsset(): boolean {
        return false;
    }

    public set autoSetSubLoadAsset(v: boolean) {
        if (v) YJLoadAssets.setLoadAsset(this.node, this);
    }

    private atlases: any[] = [];

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

        if (this.loadLanguageBundle) bundles[bundles.length] = YJi18n.ins.language;
        if (bundles.length == 0) return;
        await this.loadBundles(bundles);

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
                const bundle = no.assetBundleManager.assetPath(this.textureInfos[i].path).bundle,
                    info1: any = no.assetBundleManager.getBundle(bundle).getAssetInfo(this.textureInfos[i].assetUuid),
                    info2: any = no.assetBundleManager.getBundle(bundle).getAssetInfo(this.textureInfos[i].atlasJsonUuid);
                requests[requests.length] = { path: info1.path, bundle: bundle };
                requests[requests.length] = { path: info2.path, bundle: bundle };
            } else {
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

        let textures: Texture2D[] = [];
        if (requests.length > 0) {
            let a = false;
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                items.forEach(item => {
                    const uuid = item._uuid;
                    let i = atlasUuids.indexOf(uuid);
                    if (i > -1)
                        this.atlases[i] = (item as JsonAsset).json;
                    else {
                        i = textureUuids.indexOf(uuid);
                        if (i > -1)
                            textures[i] = item as Texture2D;
                    }
                });
                a = true;
            });
            await no.waitFor(() => { return a });
            if (this.loadLanguageBundle) {
                textures = textures.concat(await this._loadLanguageBundle());
            }
        } else if (this.loadLanguageBundle) {
            textures = textures.concat(await this._loadLanguageBundle());
        }
        this.createMaterial(textures);
        this.backgroundLoadInfos.forEach(info => {
            info.load();
        });
    }

    private async _loadLanguageBundle() {
        let a = false, textures: Texture2D[] = [];
        no.assetBundleManager.loadAllFilesInBundle(YJi18n.ins.language, [SpriteAtlas], null, items => {
            if (items) {
                items.forEach(item => {
                    if (item instanceof JsonAsset) {
                        this.atlases[this.atlases.length] = item.json;
                    } else if (item instanceof Texture2D) {
                        textures[textures.length] = item;
                    }
                });
            }
            a = true;
        });
        await no.waitFor(() => { return a; });
        return textures;
    }

    private async loadBundles(bundles: string[]) {
        no.log('YJLoadAssets loadBundles', bundles);
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadBundles(bundles, p => {
                if (p >= 1) resolve();
            });
        });
    }

    private createMaterial(textures: Texture2D[]) {
        if (sys.platform == sys.Platform.WECHAT_GAME && sys.os == sys.OS.IOS) return;
        const ssm = this.getComponent(YJSetSample2DMaterial);
        if (ssm && ssm.enabled && textures.length) {
            ssm.setAtlases(textures);
            this.getComponent(YJDynamicAtlas).customMaterial = ssm.material;
        }
    }

    /**
     * 释放图集
     */
    public release() {
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
