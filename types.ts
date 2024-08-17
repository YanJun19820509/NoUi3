
import { SetMoveAlongWithPath } from './fuckui/SetMoveAlongWithPath';
import { no } from './no';
import { Asset, JsonAsset, Material, Prefab, SpriteFrame, Texture2D, ccclass, property } from './yj';

/**
 * Predefined variables
 * Name = types
 * DateTime = Mon Jun 20 2022 15:06:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = types.ts
 * FileBasenameNoExtension = types
 * URL = db://assets/NoUi3/types.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

export interface IUV {
    u: number;
    v: number;
}

export enum AlignType {
    None = 0,
    Top,
    Middle,
    Bottom,
    Left,
    Center,
    Right
};

export enum SimpleValueType {
    String = 0,
    Number,
    Boolean,
    Array,
    Object
};

export type CreateSpritemFrameSFData = { name: string, x: number, y: number };

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

export type CreateSpritemFrameData = {
    width: number,
    height: number,
    spriteFrames: CreateSpritemFrameSFData[],
    labels: CreateSpritemFrameLabelData[]
};

export type PackedFrameData = { x: number, y: number, w: number, h: number, rotate: boolean, texture: Texture2D };

export type _SetMoveAlongWithPath = SetMoveAlongWithPath;
export type SpriteFrameDataType = { uuid: string, rect: number[], originalSize: number[], textureSize: number[], uv: number[], uvSliced?: IUV[], capInsets?: number[], rotated: boolean, scale: number };

@ccclass('Range')
export class Range {
    @property({ step: 1 })
    min: number = 0;
    @property({ step: 1 })
    max: number = 0;

    constructor(min = 0, max = 0) {
        this.min = min;
        this.max = max;
    }

    clone(): Range {
        return new Range(this.min, this.max);
    }

    equals(other: Range): boolean {
        return this.min == other.min && this.max == other.max;
    }

    contains(v: number): boolean {
        return v >= this.min && v <= this.max;
    }

    under(v: number): boolean {
        return v < this.min;
    }
    above(v: number): boolean {
        return v > this.max;
    }
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
    toString(): string {
        return `min=${this.min},max=${this.max}`;
    }

    get randomValue(): number {
        return no.randomBetween(this.min, this.max);
    }

    public static new(): Range {
        return new Range();
    }

    public static toArray(v: Range): number[] {
        return [v.min, v.max];
    }

    public static fromArray(v: number[]): Range {
        return new Range(v[0], v[1]);
    }

    /**
     * 字符串转range
     * @param v like '1,2'
     * @returns 
     */
    public static fromString(v: string): Range {
        const a = v.split(',');
        return new Range(Number(a[0]), Number(a[1]));
    }

    /**
     * 当v<min,返回min；当v>max，返回max；否则返回v
     * @param v 
     */
    public clamp(v: number): number {
        if (v < this.min) return this.min;
        if (v > this.max) return this.max;
        return v;
    }
}

@ccclass('UV')
export class UV {
    @property({ step: 1 })
    u: number = 0;
    @property({ step: 1 })
    v: number = 0;

    constructor(u = 0, v = 0) {
        this.u = u;
        this.v = v;
    }

    clone(): UV {
        return new UV(this.u, this.v);
    }

    equals(other: UV): boolean {
        return this.u == other.u && this.v == other.v;
    }

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
    toString(): string {
        return `u=${this.u},max=${this.v}`;
    }

    public static toArray(v: UV): number[] {
        return [v.u, v.v];
    }

    public static fromArray(v: number[]): UV {
        return new UV(v[0], v[1]);
    }
}

/**
 * 注解 用于向类中添加元数据.
 * @param key 元数据key
 * @param value 元数据值
 * @returns
 */
export function addMeta(key: string, value: string) {
    return function (target: Function) {
        target.prototype[key] = value;
    };
}

export const YJPanelPrefabMetaKey = 'prefabPath';
export const YJPanelPrefabUuidMetaKey = 'prefabUuid';
export const YJAddPanelToMetaKey = 'addPanelToTargetName';
export const YJAllowMultipleOpen = 'allowmultipleopen';
export const YJPanelCreated = 'panelcreated';
export const YJPanelNeedLoadBundleName = 'needloadbundlename';
/**
 * 注解，向YJPanel添加prefab path 元数据
 * @param path
 * @returns
 */
export function panelPrefabPath(path: string) {
    return addMeta(YJPanelPrefabMetaKey, path);
}
/**
 * 向YJPanel添加prefab uuid 元数据
 * @param uuid 
 * @returns 
 */
export function panelPrefabUuid(uuid: string) {
    return addMeta(YJPanelPrefabUuidMetaKey, uuid);
}
/**
 * 向YJPanel添加所属层级别名 元数据
 * @param targetName 
 * @returns 
 */
export function addPanelTo(targetName: string) {
    return addMeta(YJAddPanelToMetaKey, targetName);
}
/**
 * 向YJPanel添加允许创建多个 元数据
 * @returns 
 */
export function AllowMultipleOpen() {
    return addMeta(YJAllowMultipleOpen, '1');
}
/**
 * 向SingleObjectManager注册单例对象
 * @returns 
 */
export function singleObject() {
    return function (target: Function) {
        no.SingleObjectManager.register(target);
    };
}


@ccclass("LoadAssetsInfo")
export class LoadAssetsInfo {
    @property({ readonly: true, displayName: '资源uuid' })
    assetUuid: string = '';
    @property({ readonly: true, displayName: '资源名称' })
    assetName: string = '';
    @property({ readonly: true, displayName: '资源路径' })
    path: string = '';

    public async load(): Promise<Asset> {
        let file = no.assetBundleManager.getAssetFromCache(this.assetUuid);
        if (file) {
            file.addRef();
            return file;
        } else
            return new Promise<Asset>(resolve => {
                if (this.path)
                    no.assetBundleManager.loadBundle(no.assetBundleManager.assetPath(this.path).bundle, () => {
                        no.assetBundleManager.loadByUuid<Asset>(this.assetUuid, file => {
                            resolve(file);
                        });
                    });
                else
                    no.assetBundleManager.loadByUuid<Asset>(this.assetUuid, file => {
                        resolve(file);
                    });
            });
    }

    public release(cb?: (asset: Asset) => void): void {
        let file = no.assetBundleManager.getAssetFromCache(this.assetUuid);
        if (file) {
            cb?.(file);
            no.assetBundleManager.decRef(file);
        }
    }

    public setPath() {
        if (!this.assetUuid) {
            this.path = '';
        } else {
            no.EditorMode.getAssetInfo(this.assetUuid).then(info => {
                this.assetName = info.name;
                this.path = info?.path;
            });
        }
    }

    public setUuid() {
        if (!this.path) {
            this.assetUuid = '';
        } else {
            no.EditorMode.getAssetUuidByUrl(this.path).then(uuid => {
                this.assetUuid = uuid;
            });
        }
    }
}

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
    @property({ readonly: true, displayName: '图集配置文件uuid' })
    atlasJsonUuid: string = '';
    @property({ readonly: true, displayName: '图集配置文件名称' })
    atlasJsonName: string = '';
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
        no.EditorMode.getAssetInfo(this.assetUuid).then(info => {
            this.path = info.path;
            this.assetName = info?.displayName;
            let path = info?.path.replace('/texture', '_atlas.json');
            if (path) {
                no.EditorMode.getAssetInfo(path).then(info => {
                    this.atlasJsonName = info.name;
                    this.atlasJsonUuid = info.uuid;
                });
            }
        });
    }

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
            no.EditorMode.getAssetInfo(this.assetUuid).then(info => {
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