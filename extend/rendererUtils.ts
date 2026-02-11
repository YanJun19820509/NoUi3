/**
 * 
 * Author mqsy_yj
 * DateTime Mon Feb 09 2026 09:39:36 GMT+0800 (中国标准时间)
 *
 */

import { colorUtils } from './colorUtils';
import { YJVertexColorTransitionManager } from "../engine/YJVertexColorTransition";
import { no } from "../no";
import { Color, Label, LabelOutline, LabelShadow, Material, Skeleton, Sprite, SpriteFrame, Texture2D, UIRenderer, v2, v3, v4, Vec2, Vec3, Vec4 } from "../yj";
import { assetUtils } from './assetUtils';
/**
 * 渲染组件工具类
 * @namespace rendererUtils
 * @description 提供渲染组件的工具方法
 * @example
 * rendererUtils.color(label, "#ff0000");
 * rendererUtils.color(label, new Color(255,0,0));
 * rendererUtils.color(label);
 */
export namespace rendererUtils {
    /**
     * 设置颜色
     * @param comp 渲染组件
     * @param color 颜色
     * @returns 如果color参数为空，则返回设置后的颜色
     * @example
     * rendererUtils.color(label, "#ff0000");
     * rendererUtils.color(label, new Color(255,0,0));
     * rendererUtils.color(label);
     */
    export function color(comp: UIRenderer | LabelOutline | LabelShadow, color?: Color | string): void | Color {
        if (!comp) return;
        if (color != undefined) {
            if (typeof color == 'string') {
                comp.color = colorUtils.str2Color(color);
            } else {
                comp.color = color;
            }
        } else {
            return comp.color;
        }
    }


    /** 材质缓存 */
    const materialCache = new Map<string, Material>();
    /** 材质加载中 */
    const materialLoading = new Map<string, ((material: Material) => void)[]>();

    //创建新的材质
    export function createMaterialAsync(path: string, cb: (material: Material) => void) {
        if (materialCache.has(path)) {
            cb(materialCache.get(path));
            return;
        }
        if (materialLoading.has(path)) {
            materialLoading.get(path).push(cb);
            return;
        }
        materialLoading.set(path, [cb]);
        // 加载新材质
        assetUtils.assetBundleManager.loadEffect(path, item => {
            const material = new Material();
            material.initialize({ effectAsset: item });
            materialCache.set(path, material);
            const callbacks = materialLoading.get(path);
            if (callbacks) {
                for (const c of callbacks) {
                    c?.(material);
                }
            }
            materialLoading.delete(path);
        });
    }

    /**
     * 设置材质
     * @param comp 渲染组件
     * @param info 材质信息
     * @param isSample2D 是否使用采样2D纹理
     */
    export function shader(comp: UIRenderer, info: { path?: string, properties?: any, defines?: any }, isSample2D: boolean) {
        let { path, properties, defines } = info;
        if (!path) {
            if (comp instanceof Sprite) {
                if (isSample2D) {
                    // 使用顶点颜色过渡管理器
                    YJVertexColorTransitionManager.ins().add(comp as Sprite, defines, properties);
                } else {
                    setProperties(comp.material, defines, properties);
                }
            }
            else if (comp instanceof Skeleton) {
                setSkeletonMaterial(comp, defines, properties);
            }
        }
        else {
            // 加载新材质
            createMaterialAsync(path, material => {
                comp.customMaterial = material;
                shader(comp, info, isSample2D);
            });
        }
    }

    function setSkeletonMaterial(skeleton: Skeleton, defines: any, properties: any) {
        if (skeleton.skeletonData) {
            checkSkeletonMaterial(skeleton, defines, properties);
        } else {
            const subSkeleton = skeleton.getComponentInChildren(Skeleton);
            if (subSkeleton?.skeletonData) {
                checkSkeletonMaterial(subSkeleton, defines, properties);
            }
        }
    }

    function checkSkeletonMaterial(skeleton: Skeleton, defines: any, properties: any) {
        //如果是骨骼动画，则遍历骨骼动画的材质
        const materialCache = skeleton['_materialCache'];
        if (materialCache && Object.keys(materialCache).length > 0) {
            for (const key in materialCache) {
                setProperties(materialCache[key], defines, properties);
            }
        }
        else {
            setTimeout(() => {
                checkSkeletonMaterial(skeleton, defines, properties);
            }, 50);
        }
    }

    /**
     * 设置材质属性
     * @param material 目标材质
     * @param defines 着色器宏定义
     * @param properties 材质属性（支持标量/向量）
     * @注意 属性数组长度决定向量类型：
     * - 1: number
     * - 2: Vec2
     * - 3: Vec3 
     * - 4: Vec4
     * @示例
     * // 设置二维向量属性
     * setProperties(material, null, { u_tiling: [2, 2] });
     */
    function setProperties(material?: Material, defines?: any, properties?: any) {
        if (!material) return;
        // 设置着色器宏
        if (defines) material.recompileShaders(defines);
        // 设置材质属性
        if (properties) {
            let v: number | Vec2 | Vec3 | Vec4;
            let p: any;
            for (const key in properties) {
                if (no.materialHasProperty(material, 0, 0, key)) {
                    p = [].concat(properties[key]);
                    switch (p.length) {
                        case 1: // 标量
                            v = p[0];
                            break;
                        case 2: // 二维向量
                            v = v2(p[0], p[1]);
                            break;
                        case 3: // 三维向量
                            v = v3(p[0], p[1], p[2]);
                            break;
                        case 4: // 四维向量
                            v = v4(p[0], p[1], p[2], p[3]);
                            break;
                    }
                    material.setProperty(key, v);
                }
            }
        }
    }

    /**
     * 计算子图在合图中的实际UV区域和宽高比
     * @流程说明
     * 1. 获取共享材质（避免影响其他实例）
     * 2. 获取精灵帧和纹理
     * 3. 计算实际UV区域和宽高比
     * @注意 适用于Sprite和Label组件
     */
    export function caculateFactUvInAtlas(renderComp: UIRenderer) {
        // 使用共享材质保证多实例同步
        const material = renderComp.sharedMaterial || renderComp.material;
        if (!material || !material.effectAsset) return;

        let f: SpriteFrame, texture: Texture2D;
        if (renderComp instanceof Sprite) {
            f = renderComp.spriteFrame;
            texture = f.texture as Texture2D;
        } else if (renderComp instanceof Label) {
            f = renderComp['_ttfSpriteFrame'];
            if (!f) return;
            texture = f.texture as Texture2D;
        }
        return { rect: new Vec4(f.uv[4], f.uv[5], f.uv[2] - f.uv[4], f.uv[3] - f.uv[5]), ratio: texture.width / texture.height }
    }

    /**
     * 设置灰态
     * @param sprite 渲染组件
     * @param showGray 是否显示灰态
     */
    export function gray(sprite: Sprite, showGray: boolean) {
        if (!sprite) return;
        sprite.grayscale = showGray;
    }

    /**
     * 设置采样2D纹理灰度效果
     * @param comp 渲染组件
     * @param showGray 是否显示灰态
     */
    export function graySample2D(comp: UIRenderer, showGray: boolean) {
        if (!comp) return;
        shader(comp, {
            defines: {
                '0-2': showGray
            }
        }, true);
    }

    /**
     * 设置采样2D纹理遮罩效果
     * @param comp 渲染组件
     * @param showMask 是否显示遮罩
     */
    export function maskSample2D(comp: UIRenderer, showMask: boolean) {
        if (!comp) return;
        shader(comp, {
            defines: {
                '0-5': showMask
            }
        }, true);
    }
}