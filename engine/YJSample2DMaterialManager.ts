import { YJTextureManager } from "../base/YJTextureManager";
import { no } from "../no";
import { singleObject, SpriteFrameDataType, TextureInfo } from "../types";
import { Asset, ccclass, EffectAsset, ImageAsset, JsonAsset, Material, Texture2D } from "../yj";
import { Atlas } from "./atlas";
import { YJShowDynamicAtlasDebug } from "./YJShowDynamicAtlasDebug";
/**
 * 
 * Author mqsy_yj
 * DateTime Fri Aug 16 2024 14:52:53 GMT+0800 (中国标准时间)
 * 动态材质管理器
 */

const REUSE_MATERIAL = true; //是否复用材质
//创建新的材质
const createMaterial = function () {
    const material = new Material();
    material._uuid = no.uuid();
    const effectAsset = EffectAsset.get('../NoUi3/effect/sample2d');
    if (effectAsset) {
        material.initialize({
            effectAsset: effectAsset,
            defines: { 'USE_TEXTURE': true, 'USE_ALPHA_TEST': true }
        });
    } else {
        no.err('../NoUi3/effect/sample2d 未加载')
    }
    return material;
}

@ccclass('YJSample2DMaterialManager')
@singleObject()
export class YJSample2DMaterialManager extends no.SingleObject {
    private materialInfos: YJSample2DMaterialInfo[] = [];

    public static get ins(): YJSample2DMaterialManager {
        return super.instance();
    }



    private createMaterialInfo(name: string) {
        const materialInfo = new YJSample2DMaterialInfo(name);

        if (REUSE_MATERIAL)
            this.materialInfos.push(materialInfo);
        return materialInfo;
    }

    public async getMaterial(name: string, textureInfos: TextureInfo[]): Promise<YJSample2DMaterialInfo> {
        let uuids: string[] = [];
        textureInfos.forEach(a => {
            uuids.push(a.assetUuid);
        });
        let materialInfo = this.materialInfos[this.materialInfos.length - 1];
        let needLoadIdxes = materialInfo?.getNeedLoadIdxes(uuids);
        if (!materialInfo || !needLoadIdxes) {
            materialInfo = this.createMaterialInfo(name);
            await this.loadTextures(materialInfo, textureInfos);
        } else {
            materialInfo.refCount++;
            if (needLoadIdxes.length > 0) {
                await this.loadTextures(materialInfo, textureInfos, needLoadIdxes);
            }
        }
        return materialInfo;
    }

    public deleteMaterial(materialInfo: YJSample2DMaterialInfo) {
        if (REUSE_MATERIAL) {
            no.removeFromArray(this.materialInfos, materialInfo, 'uuid');
        }
    }

    private async loadTextures(materialInfo: YJSample2DMaterialInfo, textureInfos: TextureInfo[], idxes?: number[]) {
        let requests: { uuid?: string, path?: string, bundle?: string, type?: typeof Asset | typeof ImageAsset }[] = [];
        let textureIdx: any = {}, jsonIdx: any = {}, textures: Texture2D[] = [], atlasJsons: any[] = [];
        const n = idxes?.length || textureInfos.length;
        for (let i = 0; i < n; i++) {
            const textureInfo = textureInfos[idxes ? idxes[i] : i];
            const assetUuid = textureInfo.assetUuid.split('@')[0];
            if (YJTextureManager.hasTexture(assetUuid)) {
                textures[textures.length] = YJTextureManager.getTexture(assetUuid);
            } else {
                if (textureInfo.path) {
                    const bundle = no.assetBundleManager.assetPath(textureInfo.path).bundle;
                    const info1: any = no.assetBundleManager.getLoadedBundle(bundle).getAssetInfo(assetUuid);
                    requests[requests.length] = { path: info1.path, bundle: bundle, type: ImageAsset };
                } else {
                    requests[requests.length] = { uuid: assetUuid, type: ImageAsset };
                }
                textures[textures.length] = null;
                textureIdx[assetUuid] = textures.length - 1;
            }
            const atlasJson = this.getAtlasJson(textureInfo.atlasJsonUuid);
            if (atlasJson != null) {
                atlasJsons[atlasJsons.length] = atlasJson;
            } else {
                if (textureInfo.path) {
                    const bundle = no.assetBundleManager.assetPath(textureInfo.path).bundle;
                    const info2: any = no.assetBundleManager.getLoadedBundle(bundle).getAssetInfo(textureInfo.atlasJsonUuid);
                    requests[requests.length] = { path: info2.path, bundle: bundle, type: JsonAsset };
                } else {
                    requests[requests.length] = { uuid: textureInfo.atlasJsonUuid, type: JsonAsset };
                }
                atlasJsons[atlasJsons.length] = null;
                jsonIdx[textureInfo.atlasJsonUuid] = atlasJsons.length - 1;
            }
        }
        if (requests.length > 0) {
            await this._loadFiles(requests, textureIdx, jsonIdx, textures, atlasJsons);
        }
        materialInfo.setAtlases(textures, atlasJsons);
    }

    private async _loadFiles(requests: any[], textureIdx: any, jsonIdx: any, textures: Texture2D[], atlasJsons: any[]) {
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
                items.forEach(item => {
                    if (item instanceof JsonAsset) {
                        this.setAtlasJson(item.uuid, item.json)
                        const i = jsonIdx[item.uuid];
                        if (i != null)
                            atlasJsons[i] = item.json;
                        else
                            atlasJsons[atlasJsons.length] = item.json;
                        no.assetBundleManager.decRef(item);
                    } else if (item instanceof ImageAsset) {
                        no.assetBundleManager.cacheImage(item);
                        const t = YJTextureManager.getTexture(item.uuid);
                        const i = textureIdx[item.uuid];
                        if (i != null)
                            textures[i] = t;
                        else
                            textures[textures.length] = t;
                    }
                });
                resolve();
            });
        });
    }

    private getAtlasJson(uuid: string): any | null {
        return no.assetBundleManager.getCachedAtlasJson(uuid) || null;
    }

    private setAtlasJson(uuid: string, json: any): void {
        no.assetBundleManager.cacheAsset(uuid, json)
    }
}

@ccclass('YJSample2DMaterialInfo')
export class YJSample2DMaterialInfo {
    public material: Material;
    public atlas: Atlas;
    public uuid: string;
    public refCount: number = 0;
    private textureUuids: string[] = [];
    private spriteFrameMap: any = {};
    private atlasJsons: any[] = [];
    private textures: Texture2D[] = [];
    private name: string;

    constructor(name: string) {
        this.uuid = no.uuid();
        this.refCount++;
        this.name = name;

        this.material = createMaterial();
        const size = REUSE_MATERIAL ? 2048 : 1024;
        this.atlas = new Atlas(size, size, name);

        YJShowDynamicAtlasDebug.ins.add(this.atlas, name);

    }

    public destroy() {
        if (--this.refCount > 0) {
            return;
        }
        YJShowDynamicAtlasDebug.ins.remove(this.name);
        this.textures.forEach(a => {
            YJTextureManager.returnTexture(a.uuid);
        });
        this.textures.length = 0;
        this.atlasJsons.length = 0;
        this.textureUuids.length = 0;
        this.spriteFrameMap = {};
        this.material?.destroy();
        this.material = null;
        this.atlas?.destroy();
        this.atlas = null;
        YJSample2DMaterialManager.ins.deleteMaterial(this);
    }

    public getNeedLoadIdxes(textureUuids: string[]): number[] {
        const idxes: number[] = [];
        textureUuids.forEach((uuid, i) => {
            if (this.textureUuids.indexOf(uuid) == -1) {
                idxes.push(i);
            }
        });
        return this.textureUuids.length + idxes.length < 8 ? idxes : null;
    }

    //设置材质的贴图
    public setAtlases(textures: Texture2D[], jsons: any[]) {
        for (let i = 0, n = textures.length; i < n; i++) {
            const key = `atlas${this.textures.length}`;
            this.textures.push(textures[i]);
            if (no.materialHasProperty(this.material, 0, 0, key)) {
                this.material.setProperty(key, textures[i], 0);
            } else {
                no.err(`YJSetSample2DMaterial setAtlases key(${key}) 不存在！`)
            }
        }
        this.atlasJsons = this.atlasJsons.concat(jsons);
    }

    /**
     * 从spriteframe的数据文件中获取spriteFrameInfo
     * @param name spriteFrame的名称
     * @returns [所属atlas下标，SpriteFrameInfo]
     */
    public getSpriteFrameInAtlas(name: string): [number, SpriteFrameDataType] {
        let a = this.spriteFrameMap[name];
        if (a) return a;
        let info: SpriteFrameDataType, idx: number;
        for (let i = 0, n = this.atlasJsons.length; i < n; i++) {
            const s = this.atlasJsons[i][name];
            if (s) {
                info = s;
                idx = i;
                break;
            }
        }
        a = [idx, info];
        this.spriteFrameMap[name] = a;
        return a;
    }
}