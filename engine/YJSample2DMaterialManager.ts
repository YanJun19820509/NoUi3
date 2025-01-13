import { no } from "../no";
import { singleObject, SpriteFrameDataType, TextureInfo } from "../types";
import { Asset, ccclass, EffectAsset, ImageAsset, JsonAsset, Material, Texture2D } from "../yj";
import { Atlas } from "./atlas";
import { YJDynamicAtlas } from "./YJDynamicAtlas";
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
    const all = EffectAsset.getAll();
    let effectAsset: EffectAsset;
    for (const key in all) {
        if (key.endsWith('NoUi3/effect/sample2d')) {
            effectAsset = all[key];
            break;
        }
    }
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
    private noShareMaterialInfos: YJSample2DMaterialInfo[] = [];
    private atlasJson: Map<string, any> = new Map();

    public static get ins(): YJSample2DMaterialManager {
        return super.instance();
    }

    private createMaterialInfo(name: string, reuse: boolean) {
        const materialInfo = new YJSample2DMaterialInfo(name, reuse);

        if (reuse)
            this.materialInfos.push(materialInfo);
        else
            this.noShareMaterialInfos.push(materialInfo);
        return materialInfo;
    }

    public getMaterialInfo(uuid: string): YJSample2DMaterialInfo {
        let i = no.indexOfArray(this.materialInfos, uuid, 'uuid');
        if (i > -1)
            return this.materialInfos[i];
        else {
            i = no.indexOfArray(this.noShareMaterialInfos, uuid, 'uuid');
            return this.noShareMaterialInfos[i];
        }
    }

    public getAtlasInfo(path: string, spriteName: string): any | null {
        return this.atlasJson.get(path)?.[spriteName];
    }

    public async createAtlasMaterial(name: string, textureInfos: TextureInfo[], share: boolean): Promise<string> {
        let materialInfo = this.materialInfos[this.materialInfos.length - 1];
        const needLoadIdxes: number[] = [];
        let canUse = true;
        if (materialInfo) {
            textureInfos.forEach((a, i) => {
                if (!materialInfo.hasTexture(a.path))
                    needLoadIdxes.push(i);
            });
            canUse = materialInfo.maxIdx + needLoadIdxes.length < 8;
        }
        if (!share || !materialInfo || !canUse) {
            materialInfo = this.createMaterialInfo(name, share && REUSE_MATERIAL);
            await this.loadTextures(materialInfo, textureInfos);
        } else {
            materialInfo.refCount++;
            if (needLoadIdxes.length > 0) {
                await this.loadTextures(materialInfo, textureInfos, needLoadIdxes);
            }
        }
        return materialInfo.uuid;
    }

    public deleteMaterial(materialInfo: YJSample2DMaterialInfo) {
        if (REUSE_MATERIAL) {
            no.removeFromArray(this.materialInfos, materialInfo, 'uuid');
        }
        no.removeFromArray(this.noShareMaterialInfos, materialInfo, 'uuid');
    }

    public async loadTextures(materialInfo: YJSample2DMaterialInfo, textureInfos: TextureInfo[], idxes?: number[]) {
        const promises: Promise<void>[] = [];
        for (let i = 0, n = idxes?.length || textureInfos.length; i < n; i++) {
            const textureInfo = textureInfos[idxes ? idxes[i] : i];
            promises.push(this.loadTextureAssets(textureInfo, materialInfo));
        }
        await Promise.all(promises);
    }

    // private async loadTextures(materialInfo: YJSample2DMaterialInfo, textureInfos: TextureInfo[], idxes?: number[]) {
    //     let requests: { uuid?: string, path?: string, bundle?: string, type?: typeof Asset | typeof ImageAsset }[] = [];
    //     let textureIdx: any = {}, jsonIdx: any = {}, textures: Texture2D[] = [], atlasJsons: any[] = [];
    //     const n = idxes?.length || textureInfos.length;
    //     for (let i = 0; i < n; i++) {
    //         const textureInfo = textureInfos[idxes ? idxes[i] : i];
    //         const assetPath = textureInfo.path;
    //         if (no.assetBundleManager.hasAsset(assetPath)) {
    //             textures[textures.length] = no.assetBundleManager.loadInCache(assetPath) as Texture2D;
    //         } else {
    //             const bundle = assetPath.split('/')[0];
    //             requests[requests.length] = { path: assetPath.replace(bundle + '/', ''), bundle: bundle, type: Texture2D };
    //             textures[textures.length] = null;
    //             textureIdx[assetPath] = textures.length - 1;
    //         }
    //         const atlasJsonPath = textureInfo.atlasJsonPath;
    //         if (this.atlasJson.has(atlasJsonPath)) {
    //             atlasJsons[atlasJsons.length] = this.atlasJson.get(atlasJsonPath);
    //         } else {
    //             const bundle = atlasJsonPath.split('/')[0];
    //             requests[requests.length] = { path: atlasJsonPath.replace(bundle + '/', ''), bundle: bundle, type: JsonAsset };
    //             atlasJsons[atlasJsons.length] = null;
    //             jsonIdx[atlasJsonPath] = atlasJsons.length - 1;
    //         }
    //     }
    //     if (requests.length > 0) {
    //         await this._loadFiles(requests, textureIdx, jsonIdx, textures, atlasJsons);
    //     }
    //     materialInfo.setAtlases(textures, atlasJsons);
    // }

    // private async _loadFiles(requests: any[], textureIdx: any, jsonIdx: any, textures: Texture2D[], atlasJsons: any[]) {
    //     return new Promise<void>(resolve => {
    //         no.assetBundleManager.loadAnyFiles(requests, null, (items) => {
    //             items.forEach(item => {
    //                 if (item instanceof JsonAsset) {
    //                     this.setAtlasJson(item.uuid, item.json)
    //                     this.atlasJson.set()
    //                     const i = jsonIdx[item.uuid];
    //                     if (i != null)
    //                         atlasJsons[i] = item.json;
    //                     else
    //                         atlasJsons[atlasJsons.length] = item.json;
    //                     no.assetBundleManager.decRef(item);
    //                 } else if (item instanceof Texture2D) {
    //                     no.assetBundleManager.cacheImage(item);
    //                     const t = no.assetBundleManager.getTextureFromCache(item.uuid);
    //                     const i = textureIdx[item.uuid];
    //                     if (i != null)
    //                         textures[i] = t;
    //                     else
    //                         textures[textures.length] = t;
    //                 }
    //             });
    //             resolve();
    //         });
    //     });
    // }

    private async loadTextureAssets(textureInfo: TextureInfo, materialInfo: YJSample2DMaterialInfo) {
        return new Promise<void>(resolve => {
            const assetPath = textureInfo.path,
                jsonPath = textureInfo.atlasJsonPath,
                bundleName = textureInfo.bundleName,
                bundle = no.assetBundleManager.getLoadedBundle(bundleName);
            if (bundle) {
                materialInfo.addTexturePath(assetPath);
                const paths: string[] = [assetPath];
                if (!this.atlasJson.has(jsonPath)) {
                    paths.push(jsonPath);
                }
                bundle.load(paths, (e, assets) => {
                    if (!e) {
                        const texture = assets[0] as Texture2D;
                        const json = assets[1] as JsonAsset;
                        texture.addRef();
                        if (json) {
                            this.atlasJson.set(jsonPath, json.json);
                            no.assetBundleManager.decRef(json);
                        }
                        materialInfo.setAtlases(texture, { jsonName: jsonPath, names: Object.keys(json.json) });
                    } else {
                        no.err('YJSample2DMaterialManager.loadTextureAssets', e.message);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        }).catch(e => {
            no.err('YJSample2DMaterialManager.loadTextureAssets', e.message);
        });
    }
}

no.addToWindowForDebug('YJSample2DMaterialManager', YJSample2DMaterialManager);

@ccclass('YJSample2DMaterialInfo')
export class YJSample2DMaterialInfo {
    public dynamicAtlas: YJDynamicAtlas;
    public uuid: string;
    public refCount: number = 0;
    private texturePaths: string[] = [];
    private atlasMap: Map<string, { idx: number, jsonName: any }> = new Map();
    public maxIdx: number = 1;
    private name: string;

    constructor(name: string, reuse: boolean) {
        this.uuid = no.uuid();
        this.refCount++;
        this.name = name;

        const material = createMaterial();
        const size = reuse ? 2048 : 1024;
        const atlas = new Atlas(size, size, name);
        this.dynamicAtlas = new YJDynamicAtlas(atlas, material);
        YJShowDynamicAtlasDebug.ins.add(atlas, name);
    }

    public destroy() {
        if (--this.refCount > 0) {
            return;
        }
        YJShowDynamicAtlasDebug.ins.remove(this.name);
        this.dynamicAtlas.destroy();
        this.atlasMap.clear();
        this.texturePaths.length = 0;
        YJSample2DMaterialManager.ins.deleteMaterial(this);
    }

    public hasTexture(texturePaths: string): boolean {
        return this.texturePaths.indexOf(texturePaths) > -1;
    }

    public addTexturePath(path: string) {
        this.texturePaths.push(path);
    }

    //设置材质的贴图
    public setAtlases(texture: Texture2D, jsonInfo: { jsonName: string, names: string[] }) {
        const material = this.dynamicAtlas.customMaterial;
        const key = `atlas${this.maxIdx}`;
        if (no.materialHasProperty(material, 0, 0, key)) {
            material.setProperty(key, texture, 0);
        } else {
            no.err(`YJSample2DMaterialManager setAtlases key(${key}) 不存在！`)
        }
        const jsonName = jsonInfo.jsonName;
        const names = jsonInfo.names;
        names.forEach(name => {
            this.atlasMap.set(name, { idx: this.maxIdx, jsonName: jsonName });
        });
        this.maxIdx++;
    }

    /**
     * 从spriteframe的数据文件中获取spriteFrameInfo
     * @param name spriteFrame的名称
     * @returns [所属atlas下标，SpriteFrameInfo]
     */
    public getSpriteFrameInAtlas(name: string): [number, SpriteFrameDataType] {
        let a = this.atlasMap.get(name);
        if (a) {
            return [a.idx, YJSample2DMaterialManager.ins.getAtlasInfo(a.jsonName, name)];
        }
        return [null, null];
    }
}