
import {
    ccclass, property, menu, executeInEditMode, Component, Node,
    Asset, SpriteFrame, Material, Prefab, JsonAsset, Texture2D, ImageAsset, SpriteAtlas
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
    // @property(MaterialInfo)
    // materialInfos: MaterialInfo[] = [];
    // @property(JsonInfo)
    // jsonInfos: JsonInfo[] = [];
    @property(TextureInfo)
    textureInfos: TextureInfo[] = [];
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

    // public addAtlasUuid(uuid: string) {
    //     if (EDITOR) {
    //         let a = new LoadAssetsInfo(uuid);
    //         no.addToArray(this.jsonInfos, a, 'assetUuid');
    //     }
    // }

    // public addSpriteFrameUuid(uuid: string) {
    //     if (EDITOR) {
    //         let a = new LoadAssetsInfo(uuid);
    //         no.addToArray(this.spriteFrameInfos, a, 'assetUuid');
    //     }
    // }

    /**
     * 加载图集
     */
    public async load() {
        let requests: { uuid: string, type: typeof Asset }[] = [];
        for (let i = 0, n = this.spriteFrameInfos.length; i < n; i++) {
            requests[requests.length] = { uuid: this.spriteFrameInfos[i].assetUuid, type: SpriteFrame };
        }
        let atlasUuids: string[] = [];
        // for (let i = 0, n = this.jsonInfos.length; i < n; i++) {
        //     atlasUuids[atlasUuids.length] = this.jsonInfos[i].assetUuid;
        //     requests[requests.length] = { uuid: this.jsonInfos[i].assetUuid, type: JsonAsset };
        // }
        let textureUuids: string[] = [];
        for (let i = 0, n = this.textureInfos.length; i < n; i++) {
            atlasUuids[atlasUuids.length] = this.textureInfos[i].atlasJsonUuid;
            textureUuids[textureUuids.length] = this.textureInfos[i].assetUuid;
            requests[requests.length] = { uuid: this.textureInfos[i].assetUuid, type: Texture2D };
            requests[requests.length] = { uuid: this.textureInfos[i].atlasJsonUuid, type: JsonAsset };
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
                let textures: Texture2D[] = [];
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


                if (this.loadLanguageBundle) {
                    no.assetBundleManager.loadAllFilesInBundle(YJi18n.ins.language, SpriteAtlas, null, items => {
                        if (items) {
                            items.forEach(item => {
                                if (item instanceof JsonAsset) {
                                    this.atlases[this.atlases.length] = item.json;
                                } else if (item instanceof Texture2D) {
                                    textures[textures.length] = item;
                                } else if (item instanceof ImageAsset) {
                                    textures[textures.length] = no.assetBundleManager.getCachedTexture(item);
                                }
                            });
                        }
                        this.createMaterial(textures);
                        resolve();
                    });
                } else {
                    this.createMaterial(textures);
                    resolve();
                }
                this.backgroundLoadInfos.forEach(info => {
                    info.load();
                });
            });
        });
    }

    private createMaterial(textures: Texture2D[]) {
        const ssm = this.getComponent(YJSetSample2DMaterial);
        if (ssm && textures.length) {
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
