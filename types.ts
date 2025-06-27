import { no } from './no';
import { Asset, Bundle, JsonAsset, Material, Prefab, SpriteFrame, Texture2D, ccclass, property } from './yj';

/**
 * Predefined variables
 * Name = types
 * DateTime = Mon Jun 20 2022 15:06:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = types.ts
 * FileBasenameNoExtension = types
 * URL = db://assets/common/types.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * UV坐标接口
 * @example
 * // 在材质中设置纹理偏移
 * const uvOffset: IUV = { u: 0.5, v: 0.5 };
 */
export interface IUV {
    u: number;
    v: number;
}

/**
 * 对齐方式枚举
 * @example
 * // 设置文本对齐方式
 * label.horizontalAlign = AlignType.Center;
 * label.verticalAlign = AlignType.Middle;
 */
export enum AlignType {
    None = 0,
    Top,    // 顶部对齐
    Middle, // 垂直居中
    Bottom, // 底部对齐
    Left,   // 左侧对齐
    Center, // 水平居中
    Right   // 右侧对齐
};

/**
 * 简单值类型枚举（用于数据验证）
 * @example
 * // 验证输入数据类型
 * if (getValueType(input) !== SimpleValueType.Number) {
 *   showError("请输入数字");
 * }
 */
export enum SimpleValueType {
    String = 0,
    Number,
    Boolean,
    Array,
    Object
};

/**
 * 精灵帧创建数据（单个子帧）
 * @example
 * // 创建按钮子帧
 * const buttonFrame: CreateSpritemFrameSFData = {
 *   name: 'btn_normal',
 *   x: 0,
 *   y: 0
 * };
 */
export type CreateSpritemFrameSFData = { name: string, x: number, y: number };

/**
 * 精灵帧标签数据配置
 * @example
 * // 创建带阴影的文字标签
 * const titleLabel: CreateSpritemFrameLabelData = {
 *   string: '开始游戏',
 *   x: 100,
 *   y: 50,
 *   size: 32,
 *   color: '#FFFFFF',
 *   shadowColor: '#000000',
 *   shadowOffset: [2, 2]
 * };
 */
export type CreateSpritemFrameLabelData = {
    string: string,
    x: number,
    y: number
    size?: number,
    font?: string,
    color?: string,
    letterSpacing?: number,
    italic?: boolean,
    bold?: boolean,
    outlineColor?: string,
    outlineWidth?: number,
    shadowColor?: string,
    shadowOffset?: number[],
    shadowBlur?: number
};

/**
 * 精灵帧整体配置数据
 * @example
 * // 创建包含按钮和标签的精灵帧
 * const frameData: CreateSpritemFrameData = {
 *   width: 200,
 *   height: 100,
 *   spriteFrames: [buttonFrame],
 *   labels: [titleLabel]
 * };
 */
export type CreateSpritemFrameData = {
    width: number,
    height: number,
    spriteFrames: CreateSpritemFrameSFData[],
    labels: CreateSpritemFrameLabelData[]
};

/**
 * 打包后的帧数据（用于图集操作）
 * @example
 * // 从图集获取角色帧数据
 * const heroFrame: PackedFrameData = {
 *   x: 128,
 *   y: 256,
 *   w: 64,
 *   h: 64,
 *   rotate: false,
 *   texture: characterAtlas
 * };
 */
export type PackedFrameData = { x: number, y: number, w: number, h: number, rotate: boolean, texture: Texture2D };


/**
 * 精灵帧元数据类型（包含完整纹理信息）
 * @example
 * // 获取精灵帧元数据
 * const frameMeta: SpriteFrameDataType = await EditorMode.getAssetInfo(spriteFrame._uuid);
 */
export type SpriteFrameDataType = {
    uuid: string,
    rect: number[],
    originalSize: number[],
    textureSize: number[],
    uv: number[],
    uvSliced?: IUV[],
    capInsets?: number[],
    rotated: boolean,
    scale: number
};

/**
 * 数值范围类（支持序列化、克隆、范围判断等操作）
 * @example
 * // 创建攻击力范围
 * const damageRange = new Range(50, 100);
 * 
 * // 在属性面板中配置生命值范围
 * @property(Range)
 * hpRange: Range = new Range(100, 200);
 */
@ccclass('Range')
export class Range {
    /** 范围最小值 */
    @property({ step: 1 })
    min: number = 0;
    /** 范围最大值 */
    @property({ step: 1 })
    max: number = 0;

    /**
     * 构造数值范围
     * @param min - 最小值（默认0）
     * @param max - 最大值（默认0）
     */
    constructor(min = 0, max = 0) {
        this.min = min;
        this.max = max;
    }

    /** 创建当前范围的副本 */
    clone(): Range {
        return new Range(this.min, this.max);
    }

    /** 判断是否与另一个范围相等 */
    equals(other: Range): boolean {
        return this.min == other.min && this.max == other.max;
    }

    /** 检查数值是否在范围内 [min, max] */
    contains(v: number): boolean {
        return v >= this.min && v <= this.max;
    }

    /** 检查数值是否小于最小值 */
    under(v: number): boolean {
        return v < this.min;
    }

    /** 检查数值是否大于最大值 */
    above(v: number): boolean {
        return v > this.max;
    }

    /** 设置范围值（支持两种方式） */
    set(other: Range): void;
    set(min?: number, max?: number): void;
    set(other: Range | number, max?: number) {
        if (typeof other == 'number') {
            this.min = other;
        } else {
            this.min = other.min;
            max = other.max;
        }
        if (max != null)
            this.max = max;
    }

    /** 转换为字符串表示 */
    toString(): string {
        return `min=${this.min},max=${this.max}`;
    }

    /** 获取范围内的随机值 */
    get randomValue(): number {
        return no.randomBetween(this.min, this.max);
    }

    /** 创建新范围实例（工厂方法） */
    public static new(): Range {
        return new Range();
    }

    /** 将范围转换为数组 [min, max] */
    public static toArray(v: Range): number[] {
        return [v.min, v.max];
    }

    /** 从数组创建范围 */
    public static fromArray(v: number[]): Range {
        return new Range(v[0], v[1]);
    }

    /**
     * 从字符串解析范围（格式："min,max"）
     * @example
     * // 返回 new Range(10, 20)
     * Range.fromString("10,20");
     */
    public static fromString(v: string): Range {
        const a = v.split(',');
        return new Range(Number(a[0]), Number(a[1]));
    }

    /**
     * 将数值限制在范围内
     * @param v - 要限制的数值
     * @returns 钳制后的数值
     * @example
     * // 返回 20
     * new Range(10, 20).clamp(25);
     */
    public clamp(v: number): number {
        if (v < this.min) return this.min;
        if (v > this.max) return this.max;
        return v;
    }
}

/**
 * UV坐标操作类（用于Cocos组件序列化）
 * @example
 * // 在材质中设置UV偏移
 * const uv = new UV(0.5, 0.3);
 * material.setProperty('textureOffset', uv);
 */
@ccclass('UV')
export class UV {
    /** 水平偏移量（0-1范围） */
    @property({ step: 1 })
    u: number = 0;

    /** 垂直偏移量（0-1范围） */
    @property({ step: 1 })
    v: number = 0;

    /**
     * @param u 水平偏移量（默认0）
     * @param v 垂直偏移量（默认0）
     */
    constructor(u = 0, v = 0) {
        this.u = u;
        this.v = v;
    }

    /**
     * 创建当前UV的副本
     * @example
     * const original = new UV(0.2, 0.5);
     * const cloned = original.clone();
     */
    clone(): UV {
        return new UV(this.u, this.v);
    }

    /**
     * 比较两个UV是否相等
     * @param other 要比较的UV对象
     * @example
     * const uv1 = new UV(0.1, 0.2);
     * const uv2 = new UV(0.1, 0.2);
     * console.log(uv1.equals(uv2)); // true
     */
    equals(other: UV): boolean {
        return this.u == other.u && this.v == other.v;
    }

    /**
     * 设置UV值（支持两种方式）
     * @param other 另一个UV对象 或 u值
     * @param v 垂直偏移量（当第一个参数为number时有效）
     * @example
     * // 通过对象设置
     * uv.set(new UV(0.3, 0.4));
     * 
     * // 通过数值设置
     * uv.set(0.1, 0.5);
     */
    set(other: UV): void;
    set(u?: number, v?: number): void;
    set(other: UV | number, v?: number) {
        if (typeof other == 'number') {
            this.u = other;
        } else {
            this.u = other.u;
            v = other.v;
        }
        if (v != null)
            this.v = v;
    }

    /**
     * 转换为字符串表示
     * @returns 格式为"u=值,v=值"的字符串 
     * @example
     * new UV(0.3, 0.6).toString(); // "u=0.3,v=0.6"
     */
    toString(): string {
        return `u=${this.u},v=${this.v}`;
    }

    /**
     * 转换为数组 [u, v]
     * @example
     * UV.toArray(new UV(0.2, 0.5)); // [0.2, 0.5]
     */
    public static toArray(v: UV): number[] {
        return [v.u, v.v];
    }

    /**
     * 从数组创建UV对象
     * @param v 包含两个元素的数组 [u, v]
     * @example
     * UV.fromArray([0.4, 0.7]); // 返回 new UV(0.4, 0.7)
     */
    public static fromArray(v: number[]): UV {
        return new UV(v[0], v[1]);
    }
}

/**
 * 类装饰器工厂函数，用于向类原型添加元数据
 * @param key - 要添加的元数据键名
 * @param value - 要添加的元数据值
 * @returns 类装饰器函数
 * @example
 * // 创建自定义元数据装饰器
 * const version = (v: string) => addMeta('version', v);
 * 
 * @version('1.0.0') // 添加版本元数据
 * class MyComponent extends Component {}
 */
export function addMeta(key: string, value: string) {
    return function (target: Function) {
        target.prototype[key] = value;
    };
}

/** 预制体路径元数据键（用于存储面板预制体资源路径） */
export const YJPanelPrefabMetaKey = 'prefabPath';
/** 面板归属目标名称元数据键（用于指定面板所属层级/父节点） */
export const YJAddPanelToMetaKey = 'addPanelToTargetName';
/** 允许多开标识元数据键（控制面板是否允许重复打开） */
export const YJAllowMultipleOpen = 'allowmultipleopen';
/** 面板已创建标识元数据键（标记面板是否已实例化） */
export const YJPanelCreated = 'panelcreated';
/** 资源包名称元数据键（记录面板需要加载的资源包名） */
export const YJPanelNeedLoadBundleName = 'needloadbundlename';

/**
 * 类装饰器：为YJPanel组件指定预制体资源路径
 * @param path - 预制体在resources目录下的路径（不含扩展名）
 * @returns 类装饰器
 * @example
 * @panelPrefabPath('prefabs/LoginPanel') // 关联预制体路径
 * class LoginPanel extends YJPanel {}
 */
export function panelPrefabPath(path: string) {
    return addMeta(YJPanelPrefabMetaKey, path);
}

/**
 * 为YJPanel组件添加所属层级/父节点元数据
 * @param targetName 目标节点名称（用于指定面板的父节点或层级）
 * @returns 类装饰器
 * @example
 * @addPanelTo('MainLayer') // 将面板添加到MainLayer节点下
 * class MainMenuPanel extends YJPanel {}
 */
export function addPanelTo(targetName: string) {
    return addMeta(YJAddPanelToMetaKey, targetName);
}

/**
 * 为YJPanel组件添加允许多开标识元数据
 * @returns 类装饰器
 * @example
 * @AllowMultipleOpen() // 允许同时打开多个设置面板
 * class SettingsPanel extends YJPanel {}
 */
export function AllowMultipleOpen() {
    return addMeta(YJAllowMultipleOpen, '1');
}

/**
 * 单例对象注册装饰器（通过SingleObjectManager管理）
 * @returns 类装饰器
 * @example
 * @singleObject() // 注册为单例对象
 * class GameManager {
 *   static ins() { return no.SingleObjectManager.get(GameManager); }
 * }
 */
export function singleObject(type?: string) {
    return function (target: Function) {
        no.SingleObjectManager.register(type, target);
    };
}

/**
 * 带条件判断的节流装饰器（基于Throttling管理器实现）
 * @param waitSeconds 节流等待时间（单位：秒）
 * @param firstWait 是否首次调用需要立即执行（默认false）
 * @example
 * // 基础用法：2秒内只允许触发一次
 * @throttleWithCondition(2)
 * handleNetworkRequest() { ... }
 * 
 * // 带首次等待：第一次调用立即执行，之后2秒内阻止
 * @throttleWithCondition(2, true)
 * handleButtonClick() { ... }
 * 
 * // 配合条件判断：只在网络连接时执行节流
 * @throttleWithCondition(1)
 * updatePosition() {
 *   if(!isOnline) return false; // 返回false将跳过节流等待
 * }
 */
export function throttleWithCondition(waitSeconds: number, firstWait = false) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            no.Throttling.ins(this).wait(waitSeconds, firstWait).then(v => {
                if (v)
                    originalMethod.apply(this, args);
            });
        };
    };
}


/**
 * 资源加载信息配置类（用于编辑器环境下管理资源路径）
 * @example
 * // 创建角色预制体加载配置
 * const heroInfo = new LoadAssetsInfo();
 * heroInfo.setPathAndName('7823bdd0-12a3-4a2f-8e4c-90123456789', info => {
 *   console.log('资源路径已设置:', heroInfo.path);
 * });
 */
@ccclass("LoadAssetsInfo")
export class LoadAssetsInfo {
    /** 资源根目录路径（不包含文件名） */
    @property({ readonly: true, displayName: '根路径', editorOnly: true })
    base: string = '';
    /** 所属资源分包名称 */
    @property({ readonly: true, displayName: '分包名称' })
    bundleName: string = '';
    /** 资源显示名称（编辑器内可见） */
    @property({ readonly: true, displayName: '资源名称', editorOnly: true })
    assetName: string = '';
    /** 资源相对路径（相对于分包根目录） */
    @property({ readonly: true, displayName: '资源路径', tooltip: '相对于分包路径' })
    path: string = '';

    /**
     * 通过资源UUID设置路径信息
     * @param uuid - 资源唯一标识符（格式：7823bdd0-12a3-4a2f-8e4c-90123456789）
     * @param cb - 设置完成后的回调函数，返回资源信息对象
     * @example
     * // 设置UI纹理资源路径
     * textureInfo.setPathAndName('123e4567-e89b-12d3-a456-426614174000', info => {
     *   if(info) console.log('纹理尺寸:', info.width, info.height);
     * });
     */
    public setPathAndName(uuid: string, cb?: (info: any) => void) {
        if (!uuid) {
            this.base = '';
            this.assetName = '';
            this.path = '';
            this.bundleName = '';
            cb?.(null);
        } else {
            Promise.all([no.EditorMode.getAssetInfo(uuid), no.EditorMode.getAssetUrlByUuid(uuid)]).then(([info, url]) => {
                if (!info) return;
                this.base = info.url.replace(url, '').replace(/\.[^/.]+$/, '');
                this.bundleName = url.split('/')[0];
                this.path = url.replace(this.bundleName + '/', '');
                this.assetName = info?.displayName || info?.name;
                cb?.(info);
            }).catch(e => {
                no.err('LoadAssetsInfo.setPathAndName', uuid, e.message);
                cb?.(null);
            });
        }
    }

    /**
     * 异步加载资源（自动管理引用计数）
     * @param cb - 加载完成回调，返回加载的资源实例
     * @example
     * // 加载音效资源
     * audioInfo.loadAsset<AudioClip>(clip => {
     *   if(clip) audioSource.clip = clip;
     * });
     * 
     * // 加载完成后自动增加引用计数，需在适当时机调用asset.decRef()
     */
    public loadAsset<T extends Asset>(cb: (asset: T) => void) {
        const bundle = no.assetBundleManager.getLoadedBundle(this.bundleName);
        if (bundle) {
            bundle.load<T>(this.path, (e, asset) => {
                if (e) {
                    no.err('LoadAssetsInfo.loadAsset', this.path, e.message);
                }
                cb(asset);
                asset.addRef(); // 增加资源引用计数防止被自动释放
            });
        } else {
            no.err('LoadAssetsInfo.loadAsset bundle 不存在', this.path, this.bundleName);
            cb(null);
        }
    }

    /**
     * 从已加载资源缓存中直接获取资源（不增加引用计数）
     * @returns 已缓存的资源实例或null
     * @example
     * // 快速获取已加载的预制体
     * const prefab = levelInfo.loadAssetInCache<Prefab>();
     * if(prefab) node.instantiate(prefab);
     */
    public loadAssetInCache<T extends Asset>(): T {
        const bundle = no.assetBundleManager.getLoadedBundle(this.bundleName);
        if (bundle) {
            return bundle.get<T>(this.path);
        }
        return null;
    }
}

// @ccclass('JsonInfo')
// export class JsonInfo extends LoadAssetsInfo {
//     @property({ type: JsonAsset })
//     public get json(): JsonAsset {
//         return null;
//     }

//     public set json(v: JsonAsset) {
//         if (v) {
//             this.assetUuid = v._uuid;
//             this.assetName = v.name;
//         }
//     }
// }
@ccclass('TextureInfo')
export class TextureInfo extends LoadAssetsInfo {
    /** 
     * 图集配置文件名（编辑器专用）
     * @example
     * // 在属性面板查看自动生成的配置文件名
     * console.log(textureInfo.atlasJsonName); // 输出：character_atlas.json
     */
    @property({ readonly: true, displayName: '图集配置文件name', editorOnly: true })
    atlasJsonName: string = '';

    /** 
     * 图集配置文件相对路径（相对于assets目录）
     * @example
     * // 获取图集配置路径用于加载
     * const jsonPath = textureInfo.atlasJsonPath; // 输出：resources/character_atlas
     */
    @property({ readonly: true, displayName: '图集配置文件path' })
    atlasJsonPath: string = '';

    /** 
     * 关联的纹理资源（自动处理路径转换）
     * @example
     * // 在属性面板拖入纹理资源自动配置路径
     * textureInfo.texture = newTexture;
     * 
     * // 代码设置纹理并自动更新配置
     * await textureInfo.addTexture('fcmR3XnlRK6QHYdTQxFc1S');
     */
    @property({ type: Texture2D })
    public get texture(): Texture2D {
        return null;
    }

    public set texture(v: Texture2D) {
        if (v) {
            this.setPathAndName(v._uuid, info => {
                this.path = this.path.replace('.png', '');
                this.setAtlasJson();
            });
        }
    }

    /**
     * 通过UUID添加纹理资源（自动处理资源元数据）
     * @param uuid 资源UUID（可通过编辑器拖拽获取）
     * @returns Promise<boolean> 是否添加成功
     * @example
     * // 在编辑器扩展中通过拖拽添加资源
     * const success = await textureInfo.addTexture(selectedUUID);
     * if(success) Editor.log('纹理添加成功');
     */
    public async addTexture(uuid: string) {
        return Promise.all([no.EditorMode.getAssetInfo(uuid), no.EditorMode.getAssetUrlByUuid(uuid)]).then(([info, url]) => {
            if (!info) return false;
            this.base = info.url.replace(url, '').replace(/\.[^/.]+$/, '');
            this.assetName = info.displayName;
            this.bundleName = url.split('/')[0];
            this.path = url.replace(this.bundleName + '/', '').replace('.png', '');
            this.setAtlasJson();
            return true;
        });
    }

    /**
     * 自动生成图集JSON配置路径（根据纹理路径转换）
     * @example
     * // 当纹理路径为 resources/character/texture 时
     * // 生成路径 resources/character_atlas
     */
    private setAtlasJson() {
        this.atlasJsonPath = this.path.replace('/texture', '_atlas');
        const a = this.atlasJsonPath.split('/');
        this.atlasJsonName = [a[a.length - 1], '.json'].join('');
    }

    /**
     * 重置图集信息（兼容旧版本数据）
     * @deprecated 将在3.7.3版本中移除，请使用addTexture替代
     * @example
     * // 旧版本迁移示例（不建议新代码使用）
     * textureInfo.resetInfo();
     */
    public resetInfo() {
        if (!this.base && this.path) {
            const path = this.path.replace('/texture', '.png/texture');
            no.EditorMode.getAssetUuidByUrl(path).then(uuid => {
                this.setPathAndName(uuid, info => {
                    this.setAtlasJson();
                });
            });
        }
    }
}
// @ccclass('MaterialInfo')
// export class MaterialInfo extends LoadAssetsInfo {
//     @property({ type: Material })
//     public get material(): Material {
//         return null;
//     }

//     public set material(v: Material) {
//         if (v) {
//             this.assetUuid = v._uuid;
//             this.assetName = v.name;
//             this.setPath();
//         }
//     }

//     public addMaterial(uuid: string) {
//         this.assetUuid = uuid;
//         this.setPath();
//     }
// }
/**
 * 精灵帧资源信息管理类（继承自LoadAssetsInfo）
 * @example
 * // 在编辑器属性面板中关联精灵帧
 * @property(SpriteFrameInfo)
 * public iconInfo: SpriteFrameInfo = new SpriteFrameInfo();
 * 
 * // 通过代码设置精灵帧并自动更新路径信息
 * this.iconInfo.spriteFrame = this.loadTexture('icons/item_sword');
 */
@ccclass('SpriteFrameInfo')
export class SpriteFrameInfo extends LoadAssetsInfo {
    /**
     * 获取/设置精灵帧资源（编辑器环境下自动更新路径信息）
     * @remarks 此属性仅在编辑器模式下有效，运行时返回null
     */
    @property({ type: SpriteFrame })
    public get spriteFrame(): SpriteFrame {
        return null;
    }

    public set spriteFrame(v: SpriteFrame) {
        if (v) {
            this.setPathAndName(v._uuid);
        } else {
            this.path = '';
            this.assetName = '';
        }
    }
}

/**
 * 预制体资源信息管理类（继承自LoadAssetsInfo）
 * @example
 * // 在组件中配置预制体信息
 * @property(PrefabInfo)
 * public enemyPrefabInfo: PrefabInfo = new PrefabInfo();
 * 
 * // 动态加载配置的预制体资源
 * const prefab = await this.enemyPrefabInfo.loadAsset<Prefab>();
 * instantiate(prefab).parent = this.node;
 */
@ccclass('PrefabInfo')
export class PrefabInfo extends LoadAssetsInfo {
    /**
     * 获取/设置预制体资源（编辑器环境下自动更新路径信息）
     * @remarks 此属性仅在编辑器模式下有效，运行时返回null
     */
    @property({ type: Prefab })
    public get prefab(): Prefab {
        return null;
    }

    public set prefab(v: Prefab) {
        if (v) {
            this.setPathAndName(v._uuid);
        } else {
            this.path = '';
            this.assetName = '';
        }
    }
}
/**
 * 缓动函数类型枚举（完整支持Creator内置缓动类型）
 * @example
 * // 在补间动画中使用缓动类型
 * tween(node)
 *   .to(1, { position: new Vec3(100, 200, 0) }, { easing: EasingType.QUAD_OUT })
 * 
 * // 在属性面板中选择缓动函数
 * @property({ type: EasingType })
 * easeType: EasingType = EasingType.LINEAR;
 */
export enum EasingType {
    /** 线性插值（无缓动） */
    LINEAR = 0,
    /** 恒定速度（步进） */
    CONSTANT,
    /** 二次缓入（加速） */
    QUAD_IN,
    /** 二次缓出（减速） */
    QUAD_OUT,
    /** 二次缓入缓出 */
    QUAD_IN_OUT,
    /** 二次缓出缓入 */
    QUAD_OUT_IN,
    /** 三次缓入 */
    CUBIC_IN,
    /** 三次缓出 */
    CUBIC_OUT,
    /** 三次缓入缓出 */
    CUBIC_IN_OUT,
    /** 三次缓出缓入 */
    CUBIC_OUT_IN,
    /** 四次缓入 */
    QUART_IN,
    /** 四次缓出 */
    QUART_OUT,
    /** 四次缓入缓出 */
    QUART_IN_OUT,
    /** 四次缓出缓入 */
    QUART_OUT_IN,
    /** 五次缓入 */
    QUINT_IN,
    /** 五次缓出 */
    QUINT_OUT,
    /** 五次缓入缓出 */
    QUINT_IN_OUT,
    /** 五次缓出缓入 */
    QUINT_OUT_IN,
    /** 正弦缓入 */
    SINE_IN,
    /** 正弦缓出 */
    SINE_OUT,
    /** 正弦缓入缓出 */
    SINE_IN_OUT,
    /** 正弦缓出缓入 */
    SINE_OUT_IN,
    /** 指数缓入 */
    EXPO_IN,
    /** 指数缓出 */
    EXPO_OUT,
    /** 指数缓入缓出 */
    EXPO_IN_OUT,
    /** 指数缓出缓入 */
    EXPO_OUT_IN,
    /** 圆形缓入 */
    CIRC_IN,
    /** 圆形缓出 */
    CIRC_OUT,
    /** 圆形缓入缓出 */
    CIRC_IN_OUT,
    /** 圆形缓出缓入 */
    CIRC_OUT_IN,
    /** 弹性缓入 */
    ELASTIC_IN,
    /** 弹性缓出 */
    ELASTIC_OUT,
    /** 弹性缓入缓出 */
    ELASTIC_IN_OUT,
    /** 弹性缓出缓入 */
    ELASTIC_OUT_IN,
    /** 回弹缓入 */
    BACK_IN,
    /** 回弹缓出 */
    BACK_OUT,
    /** 回弹缓入缓出 */
    BACK_IN_OUT,
    /** 回弹缓出缓入 */
    BACK_OUT_IN,
    /** 弹跳缓入 */
    BOUNCE_IN,
    /** 弹跳缓出 */
    BOUNCE_OUT,
    /** 弹跳缓入缓出 */
    BOUNCE_IN_OUT,
    /** 弹跳缓出缓入 */
    BOUNCE_OUT_IN,
    /** 平滑过渡（自定义） */
    SMOOTH,
    /** 淡入淡出（自定义） */
    FADE,
};

/**
 * 缓动类型名称映射对象（用于编辑器显示和序列化）
 * @example
 * // 获取缓动类型显示名称
 * const typeName = EasingTypeName[EasingType.BOUNCE_OUT]; // "bounceOut"
 * 
 * // 在编辑器下拉菜单中使用
 * @property({ type: CCString, dropdownList: Object.values(EasingTypeName) })
 * easeTypeName: string = 'linear';
 */
export const EasingTypeName = {
    /** 对应 EasingType.LINEAR */
    Linear: 'linear',
    /** 对应 EasingType.CONSTANT */
    Constant: 'constant',
    /** 对应 EasingType.QUAD_IN */
    QuadIn: 'quadIn',
    /** 对应 EasingType.QUAD_OUT */
    QuadOut: 'quadOut',
    /** 对应 EasingType.QUAD_IN_OUT */
    QuadInOut: 'quadInOut',
    /** 对应 EasingType.QUAD_OUT_IN */
    QuadOutIn: 'quadOutIn',
    /** 对应 EasingType.CUBIC_IN */
    CubicIn: 'cubicIn',
    /** 对应 EasingType.CUBIC_OUT */
    CubicOut: 'cubicOut',
    /** 对应 EasingType.CUBIC_IN_OUT */
    CubicInOut: 'cubicInOut',
    /** 对应 EasingType.CUBIC_OUT_IN */
    cubicOutIn: 'cubicOutIn',
    /** 对应 EasingType.QUART_IN */
    QuartIn: 'quartIn',
    /** 对应 EasingType.QUART_OUT */
    QuartOut: 'quartOut',
    /** 对应 EasingType.QUART_IN_OUT */
    QuartInOut: 'quartInOut',
    /** 对应 EasingType.QUART_OUT_IN */
    quartOutIn: 'quartOutIn',
    /** 对应 EasingType.QUINT_IN */
    QuintIn: 'quintIn',
    /** 对应 EasingType.QUINT_OUT */
    QuintOut: 'quintOut',
    /** 对应 EasingType.QUINT_IN_OUT */
    QuintInOut: 'quintInOut',
    /** 对应 EasingType.QUINT_OUT_IN */
    QuintOutIn: 'quintOutIn',
    /** 对应 EasingType.SINE_IN */
    SineIn: 'sineIn',
    /** 对应 EasingType.SINE_OUT */
    SineOut: 'sineOut',
    /** 对应 EasingType.SINE_IN_OUT */
    SineInOut: 'sineInOut',
    /** 对应 EasingType.SINE_OUT_IN */
    SineOutIn: 'sineOutIn',
    /** 对应 EasingType.EXPO_IN */
    ExpoIn: 'expoIn',
    /** 对应 EasingType.EXPO_OUT */
    ExpoOut: 'expoOut',
    /** 对应 EasingType.EXPO_IN_OUT */
    ExpoInOut: 'expoInOut',
    /** 对应 EasingType.EXPO_OUT_IN */
    ExpoOutIn: 'expoOutIn',
    /** 对应 EasingType.CIRC_IN */
    CircIn: 'circIn',
    /** 对应 EasingType.CIRC_OUT */
    CircOut: 'circOut',
    /** 对应 EasingType.CIRC_IN_OUT */
    CircInOut: 'circInOut',
    /** 对应 EasingType.CIRC_OUT_IN */
    CircOutIn: 'circOutIn',
    /** 对应 EasingType.ELASTIC_IN */
    ElasticIn: 'elasticIn',
    /** 对应 EasingType.ELASTIC_OUT */
    ElasticOut: 'elasticOut',
    /** 对应 EasingType.ELASTIC_IN_OUT */
    ElasticInOut: 'elasticInOut',
    /** 对应 EasingType.ELASTIC_OUT_IN */
    ElasticOutIn: 'elasticOutIn',
    /** 对应 EasingType.BACK_IN */
    BackIn: 'backIn',
    /** 对应 EasingType.BACK_OUT */
    BackOut: 'backOut',
    /** 对应 EasingType.BACK_IN_OUT */
    BackInOut: 'backInOut',
    /** 对应 EasingType.BACK_OUT_IN */
    BackOutIn: 'backOutIn',
    /** 对应 EasingType.BOUNCE_IN */
    BounceIn: 'bounceIn',
    /** 对应 EasingType.BOUNCE_OUT */
    BounceOut: 'bounceOut',
    /** 对应 EasingType.BOUNCE_IN_OUT */
    BounceInOut: 'bounceInOut',
    /** 对应 EasingType.BOUNCE_OUT_IN */
    BounceOutIn: 'bounceOutIn',
    /** 对应 EasingType.SMOOTH */
    Smooth: 'smooth',
    /** 对应 EasingType.FADE */
    Fade: 'fade',
    /** 数字索引映射 */
    0: 'linear',
    1: 'constant',
    2: 'quadIn',
    3: 'quadOut',
    4: 'quadInOut',
    5: 'quadOutIn',
    6: 'cubicIn',
    7: 'cubicOut',
    8: 'cubicInOut',
    9: 'cubicOutIn',
    10: 'quartIn',
    11: 'quartOut',
    12: 'quartInOut',
    13: 'quartOutIn',
    14: 'quintIn',
    15: 'quintOut',
    16: 'quintInOut',
    17: 'quintOutIn',
    18: 'sineIn',
    19: 'sineOut',
    20: 'sineInOut',
    21: 'sineOutIn',
    22: 'expoIn',
    23: 'expoOut',
    24: 'expoInOut',
    25: 'expoOutIn',
    26: 'circIn',
    27: 'circOut',
    28: 'circInOut',
    29: 'circOutIn',
    30: 'elasticIn',
    31: 'elasticOut',
    32: 'elasticInOut',
    33: 'elasticOutIn',
    34: 'backIn',
    35: 'backOut',
    36: 'backInOut',
    37: 'backOutIn',
    38: 'bounceIn',
    39: 'bounceOut',
    40: 'bounceInOut',
    41: 'bounceOutIn',
    42: 'smooth',
    43: 'fade',
}