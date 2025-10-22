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
        if (key.endsWith('/effect/sample2d')) {
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
        no.err('/effect/sample2d 未加载')
    }
    return material;
}

@ccclass('YJSample2DMaterialManager')
@singleObject('YJSample2DMaterialManager')
/**
 * 动态材质管理器
 * @description 管理动态材质的创建、销毁和使用
 * @example
 * const materialManager = YJSample2DMaterialManager.ins;
 * const materialUuid = await materialManager.createAtlasMaterial('myAtlas', textureInfos, true);
 */
export class YJSample2DMaterialManager extends no.SingleObject {
    /**
     * 共享材质信息池（可重复使用的材质）
     * @example
     * // 典型应用场景：
     * // 当多个UI面板使用相同贴图组合时，会共享同一个材质实例
     */
    private materialInfos: YJSample2DMaterialInfo[] = [];
    /**
     * 非共享材质信息池（独占式材质）
     * @example
     * // 使用场景：
     * // 当需要特殊材质效果或贴图组合唯一时创建
     */
    private noShareMaterialInfos: YJSample2DMaterialInfo[] = [];
    /** 图集JSON数据缓存（key: 图集路径，value: 解析后的JSON对象） */
    private atlasJson: Map<string, any> = new Map();
    /** 图集子项名称索引（key: 图集路径，value: 包含所有子项名称的数组） */
    private atlasJsonKeys: Map<string, string[]> = new Map();
    /** 材质名称到UUID的映射表（key: 用户定义的材质名称，value: 材质实例UUID） */
    private keyToMaterialUuid: Map<string, string> = new Map();

    /**
     * 获取单例实例
     * @example
     * // 获取管理器单例：
     * const manager = YJSample2DMaterialManager.ins;
     */
    public static get ins(): YJSample2DMaterialManager {
        return super.instance() as YJSample2DMaterialManager;
    }

    public clear() {
        for (let i = this.materialInfos.length - 1; i >= 0; i--) {
            this.materialInfos[i].destroy(true);
        }
        for (let i = this.noShareMaterialInfos.length - 1; i >= 0; i--) {
            this.noShareMaterialInfos[i].destroy(true);
        }
        this.materialInfos = [];
        this.noShareMaterialInfos = [];
        this.atlasJson = new Map();
        this.atlasJsonKeys = new Map();
        this.keyToMaterialUuid = new Map();
    }

    /**
     * 创建材质信息对象并存入对应池
     * @param name 材质标识名称 
     * @param reuse 是否允许重复使用
     * @returns 新创建的材质信息对象
     * @example
     * // 创建共享材质：
     * this.createMaterialInfo('main_ui', true);
     * // 创建独占材质：
     * this.createMaterialInfo('boss_special_effect', false);
     */
    private createMaterialInfo(name: string, reuse: boolean) {
        const materialInfo = new YJSample2DMaterialInfo(name, reuse);

        if (reuse)
            this.materialInfos.push(materialInfo);
        else
            this.noShareMaterialInfos.push(materialInfo);
        return materialInfo;
    }

    /**
     * 根据key获取材质信息
     * @param key 材质注册时使用的名称
     * @returns 对应的材质信息对象，未找到时返回undefined
     * @example
     * // 获取主界面材质：
     * const mainUIMat = this.getMaterialInfo('main_ui');
     * // 获取BOSS特效材质：
     * const bossMat = this.getMaterialInfo('boss_effect');
     */
    public getMaterialInfo(key: string): YJSample2DMaterialInfo {
        const uuid = this.keyToMaterialUuid.get(key);
        let i = no.indexOfArray(this.materialInfos, uuid, 'uuid');
        if (i > -1)
            return this.materialInfos[i];
        else {
            i = no.indexOfArray(this.noShareMaterialInfos, uuid, 'uuid');
            return this.noShareMaterialInfos[i];
        }
    }

    /**
     * 获取指定图集的精灵数据
     * @param path 图集资源路径
     * @param spriteName 精灵名称
     * @returns 精灵的帧数据或null
     * @example
     * // 获取角色图集中的站立帧：
     * const frameData = this.getAtlasInfo('textures/role', 'stand_1');
     * // 获取武器图集的攻击帧：
     * const attackFrame = this.getAtlasInfo('effects/weapons', 'sword_slash');
     */
    public getAtlasInfo(path: string, spriteName: string): any | null {
        return this.atlasJson.get(path)?.[spriteName];
    }

    /**
     * 创建图集材质
     * @param name 材质名称（用于后续查找）
     * @param textureInfos 纹理信息数组（包含路径、图集配置等）
     * @param share 是否允许材质共享
     * @returns 材质唯一标识UUID
     * @example
     * // 创建共享材质：
     * const textureList = [
     *   { path: 'textures/ui/btn', atlasJsonPath: 'json/ui_atlas' },
     *   { path: 'textures/ui/icon', atlasJsonPath: 'json/ui_atlas' }
     * ];
     * const uuid = await materialManager.createAtlasMaterial('main_ui', textureList, true);
     * 
     * // 创建独占特效材质：
     * const effectTextures = [
     *   { path: 'effects/fire', atlasJsonPath: 'json/effect_atlas' }
     * ];
     * const effectUuid = await materialManager.createAtlasMaterial('fire_effect', effectTextures, false);
     */
    public async createAtlasMaterial(name: string, textureInfos: TextureInfo[], share: boolean): Promise<string> {
        let materialInfo: YJSample2DMaterialInfo;

        // 非共享模式或全局禁用材质复用时，直接创建新材质
        if (!share || !REUSE_MATERIAL) {
            materialInfo = this.createMaterialInfo(name, false);
        } else {
            // 尝试复用现有材质
            const { maxMaterialInfo, maxDiff } = this.reuseMaterial(textureInfos);

            if (!maxMaterialInfo) {
                // 没有合适材质可复用，创建新的可复用材质
                materialInfo = this.createMaterialInfo(name, true);
            } else {
                // 过滤出需要新增的纹理信息
                let newTextureInfos = [];
                let info: TextureInfo;
                for (let i = 0, n = textureInfos.length; i < n; i++) {
                    info = textureInfos[i];
                    // 检查当前纹理是否在差异列表中
                    for (let j = 0, m = maxDiff.length; j < m; j++) {
                        if (info.path === maxDiff[j]) {
                            newTextureInfos[newTextureInfos.length] = info;
                            break;
                        }
                    }
                }
                textureInfos = newTextureInfos;
                materialInfo = maxMaterialInfo;
                materialInfo.refCount++; // 增加材质引用计数
            }
        }

        // 加载纹理资源并建立映射关系
        await this.loadTextures(materialInfo, textureInfos);
        this.keyToMaterialUuid.set(name, materialInfo.uuid);
        return materialInfo.uuid;
    }

    private _reuseMaterialCache: { maxMaterialInfo: YJSample2DMaterialInfo, maxDiff: string[] } = { maxMaterialInfo: null, maxDiff: [] };
    /**
     * 材质复用算法
     * @param textureInfos 需要匹配的纹理信息数组
     * @returns 最佳匹配材质信息和差异列表
     * @description
     * 1. 遍历所有可复用材质
     * 2. 计算每个材质与当前需求的纹理差异
     * 3. 选择差异最小且纹理槽位充足的材质
     * @example
     * // 现有材质A包含纹理[1,2,3]，当前需要纹理[2,3,4]
     * // 差异计算为[4]，若材质A剩余槽位>=1则复用
     */
    private reuseMaterial(textureInfos: TextureInfo[]) {
        this._reuseMaterialCache.maxMaterialInfo = null;
        this._reuseMaterialCache.maxDiff = [];
        if (this.materialInfos.length == 0) {
            return this._reuseMaterialCache;
        }
        const assetPaths: string[] = [];

        // 提取纯路径列表用于比较
        for (let i = 0, n = textureInfos.length; i < n; i++) {
            assetPaths[assetPaths.length] = textureInfos[i].path;
        }

        const l = assetPaths.length;
        let maxCount = l; // 初始化最大差异数为需求纹理总数

        let materialInfo: YJSample2DMaterialInfo;
        let diff: string[];
        let count: number;
        // 遍历所有可复用材质寻找最佳匹配
        for (let i = 0, n = this.materialInfos.length; i < n; i++) {
            materialInfo = this.materialInfos[i];
            // 获取当前材质缺少的纹理列表
            diff = materialInfo.compareTexturePaths(assetPaths);
            count = diff.length;

            // 验证条件：差异数更小且纹理槽位充足（最大索引+差异数不超过8）
            if (count < maxCount && (materialInfo.maxIdx + count) < 8) {
                maxCount = count;
                this._reuseMaterialCache.maxMaterialInfo = materialInfo;
                this._reuseMaterialCache.maxDiff = diff;
            }
        }
        return this._reuseMaterialCache;
    }

    /**
     * 删除材质信息
     * @param materialInfo 需要删除的材质信息对象
     * @example
     * // 当场景卸载时释放材质：
     * const matInfo = materialManager.getMaterialInfo('scene1_bg');
     * if (matInfo) {
     *   materialManager.deleteMaterial(matInfo);
     *   matInfo.destroy(); // 执行资源销毁
     * }
     */
    public deleteMaterial(materialInfo: YJSample2DMaterialInfo) {
        // 可复用材质需要从专用列表移除
        if (REUSE_MATERIAL) {
            no.removeFromArray(this.materialInfos, materialInfo, 'uuid');
        }
        // 从非共享列表移除
        no.removeFromArray(this.noShareMaterialInfos, materialInfo, 'uuid');
    }

    /**
     * 异步加载多个纹理资源及其图集配置
     * @param materialInfo 目标材质信息对象，用于存储加载的资源
     * @param textureInfos 需要加载的纹理信息数组，包含以下属性：
     *   - path: 纹理资源路径（如：'bundle/textures/button'）
     *   - atlasJsonPath: 图集配置文件路径（如：'bundle/atlases/button'）
     *   - bundleName: 资源包名称（如：'resources'）
     * @example
     * // 加载角色皮肤材质：
     * const textureList = [
     *   { path: 'characters/skin1', atlasJsonPath: 'atlases/skin1', bundleName: 'resources' },
     *   { path: 'characters/armor', atlasJsonPath: 'atlases/armor', bundleName: 'equipment' }
     * ];
     * await materialManager.loadTextures(characterMaterial, textureList);
     */
    public async loadTextures(materialInfo: YJSample2DMaterialInfo, textureInfos: TextureInfo[]) {
        const promises: Promise<void>[] = [];
        let textureInfo: TextureInfo;
        // 并行创建所有纹理加载任务
        for (let i = 0, n = textureInfos.length; i < n; i++) {
            textureInfo = textureInfos[i];
            promises.push(this.loadTextureAssets(textureInfo, materialInfo));
        }
        // 等待所有资源加载完成
        await Promise.all(promises);
    }

    /**
     * 加载单个纹理资源及其关联的图集配置
     * @param textureInfo 纹理资源信息对象
     * @param materialInfo 目标材质信息对象
     * @returns Promise对象，在加载完成后解析
     * @example
     * // 加载单个武器纹理：
     * const weaponInfo = {
     *   path: 'weapons/sword',
     *   atlasJsonPath: 'atlases/sword',
     *   bundleName: 'equipment'
     * };
     * await loadTextureAssets(weaponInfo, weaponMaterial);
     */
    private async loadTextureAssets(textureInfo: TextureInfo, materialInfo: YJSample2DMaterialInfo) {
        return new Promise<void>(resolve => {
            const assetPath = textureInfo.path,
                jsonPath = textureInfo.atlasJsonPath,
                bundleName = textureInfo.bundleName,
                bundle = no.assetBundleManager.getLoadedBundle(bundleName);

            // 仅当资源包已加载时执行加载操作
            if (bundle) {
                // 记录纹理路径到材质信息
                materialInfo.addTexturePath(assetPath);

                // 构建需要加载的路径数组
                const paths: string[] = [assetPath];
                // 如果图集配置未缓存则加入加载列表
                if (!this.atlasJson.has(jsonPath)) {
                    paths.push(jsonPath);
                }

                // 执行实际资源加载
                bundle.load(paths, (e, assets) => {
                    if (!e) {
                        const texture = assets[0] as Texture2D;
                        const json = assets[1] as JsonAsset;

                        // 增加纹理引用计数防止被自动释放
                        texture.addRef();

                        // 处理图集配置数据
                        if (json) {
                            // 缓存图集配置并提取关键字段
                            this.atlasJson.set(jsonPath, json.json);
                            this.atlasJsonKeys.set(jsonPath, Object.keys(json.json));
                            // 减少JSON资源的引用计数
                            no.assetBundleManager.decRef(json);
                        }

                        // 构建图集配置信息对象
                        let jsonInfo = {
                            jsonName: jsonPath,
                            names: this.atlasJsonKeys.get(jsonPath)
                        };

                        // 将加载的资源关联到材质
                        materialInfo.setAtlases(texture, jsonInfo);
                    } else {
                        // 输出详细的错误日志
                        no.err('YJSample2DMaterialManager.loadTextureAssets', e.message, paths);
                    }
                    resolve();
                });
            } else {
                // 资源包未加载时直接完成（需要上层处理加载失败情况）
                resolve();
            }
        }).catch(e => {
            // 统一捕获并记录异步操作中的异常
            no.err('YJSample2DMaterialManager.loadTextureAssets', e.message);
        });
    }
}

@ccclass('YJSample2DMaterialInfo')
/**
 * 材质信息管理类，负责管理动态图集材质的相关数据
 * @property dynamicAtlas 动态图集实例，用于纹理打包和管理
 * @property uuid 材质唯一标识符
 * @property refCount 材质引用计数，用于共享材质管理
 * @property maxIdx 当前最大纹理槽位索引，用于多纹理管理
 */
export class YJSample2DMaterialInfo {
    public dynamicAtlas: YJDynamicAtlas;
    public uuid: string;
    public refCount: number = 0;
    private texturePaths: string[] = []; // 当前材质使用的所有纹理路径
    private atlasMap: Map<string, { idx: number, jsonName: any }> = new Map(); // 精灵名称映射表（名称 -> {纹理槽位, 图集配置路径}）
    public maxIdx: number = 1; // 当前最大纹理槽位索引
    private name: string; // 材质名称

    /**
     * 构造函数
     * @param name 材质名称（用于调试和查找）
     * @param reuse 是否允许材质复用
     * @example
     * // 创建可复用的UI材质：
     * new YJSample2DMaterialInfo('main_ui', true);
     * // 创建临时特效材质：
     * new YJSample2DMaterialInfo('skill_effect', false);
     */
    constructor(name: string, reuse: boolean) {
        this.uuid = no.uuid();
        this.refCount++;
        this.name = name;

        // 根据复用配置选择图集尺寸（可复用材质使用2048尺寸，临时材质使用512）
        const material = createMaterial();
        const size = 2;//reuse ? 2048 : 512;
        const atlas = new Atlas(size, size, name);
        this.dynamicAtlas = new YJDynamicAtlas(atlas, material);
        // 注册到调试显示组件
        YJShowDynamicAtlasDebug.ins.add(atlas, name);
    }

    /**
     * 销毁材质资源，引用计数归零时执行实际销毁
     * @example
     * // 当材质不再需要时调用：
     * materialInfo.destroy();
     */
    public destroy(force: boolean = false) {
        if (--this.refCount > 0 && !force) {
            return; // 仍有其他引用，不执行实际销毁
        }
        // 清理调试组件和动态图集资源
        YJShowDynamicAtlasDebug.ins.remove(this.name);
        this.dynamicAtlas.destroy();
        this.atlasMap.clear();
        this.texturePaths.length = 0;
        YJSample2DMaterialManager.ins.deleteMaterial(this);
    }

    /**
     * 比较纹理路径差异，返回当前材质未包含的路径
     * @param texturePaths 需要比较的纹理路径数组
     * @returns 差异路径数组
     * @example
     * // 检查新纹理是否需要加载：
     * const newPaths = materialInfo.compareTexturePaths(['textures/ui/btn', 'textures/ui/icon']);
     */
    public compareTexturePaths(texturePaths: string[]): string[] {
        let result = [];
        for (let i = 0, n = texturePaths.length; i < n; i++) {
            if (this.texturePaths.indexOf(texturePaths[i]) == -1) {
                result[result.length] = texturePaths[i];
            }
        }
        return result;
    }

    /**
     * 检查是否包含指定纹理路径
     * @param texturePaths 需要检查的纹理路径
     */
    public hasTexture(texturePaths: string): boolean {
        return this.texturePaths.indexOf(texturePaths) > -1;
    }

    /**
     * 添加纹理路径到记录列表
     * @param path 纹理资源路径
     * @example
     * // 记录新加载的纹理：
     * materialInfo.addTexturePath('textures/characters/hero');
     */
    public addTexturePath(path: string) {
        this.texturePaths.push(path);
    }

    /**
     * 设置材质使用的纹理图集
     * @param texture 纹理资源对象
     * @param jsonInfo 图集配置信息（包含配置路径和精灵名称列表）
     * @example
     * // 设置角色图集：
     * materialInfo.setAtlases(characterTexture, {
     *   jsonName: 'json/characters',
     *   names: ['idle', 'attack', 'damage']
     * });
     */
    public setAtlases(texture: Texture2D, jsonInfo?: { jsonName: string, names: string[] }) {
        const material = this.dynamicAtlas.customMaterial;
        const key = `atlas${this.maxIdx}`;
        // 设置材质属性
        if (no.materialHasProperty(material, 0, 0, key)) {
            material.setProperty(key, texture, 0);
        } else {
            no.err(`YJSample2DMaterialManager setAtlases key(${key}) 不存在！`)
        }
        // 处理图集配置信息
        if (jsonInfo) {
            const jsonName = jsonInfo.jsonName;
            const names = jsonInfo.names;
            for (let i = 0; i < names.length; i++) {
                // 防止同名精灵覆盖，要求不同纹理必须使用不同名称
                if (this.atlasMap.has(names[i])) continue;
                this.atlasMap.set(names[i], { idx: this.maxIdx, jsonName: jsonName });
            }
        }
        this.maxIdx++; // 递增纹理槽位索引
    }

    /**
     * 获取指定名称的精灵帧数据
     * @param name 精灵帧名称
     * @returns [纹理槽位索引, 精灵帧数据]
     * @example
     * // 获取攻击特效帧数据：
     * const [index, frameData] = materialInfo.getSpriteFrameInAtlas('attack_effect');
     * 
     * @warning 不同图集禁止使用相同精灵名称，否则会返回第一个匹配结果。
     * 正确做法：
     * // 不同图集使用不同命名：
     * 'weapon_sword' 和 'effect_sword'
     */
    public getSpriteFrameInAtlas(name: string): [number, SpriteFrameDataType] {
        let a = this.atlasMap.get(name);
        if (a) {
            return [a.idx, YJSample2DMaterialManager.ins.getAtlasInfo(a.jsonName, name)];
        }
        return [null, null];
    }
}