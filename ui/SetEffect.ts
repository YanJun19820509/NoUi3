
import { Material, UIRenderer, v2, v3, v4, Vec2, Vec3, Vec4, ccclass, property, menu, SpriteFrame, Label, Sprite, Texture2D, Skeleton } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';
import { YJVertexColorTransitionManager } from '../engine/YJVertexColorTransition';

/**
 * Predefined variables
 * Name = SetEffect
 * DateTime = Sat Mar 19 2022 14:44:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetEffect.ts
 * FileBasenameNoExtension = SetEffect
 * URL = db://assets/common/ui/SetEffect.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetEffect')
@menu('NoUi/ui/SetEffect(设置shader:object)')
/**
 * Shader效果设置组件
 * @description 用于动态设置UI渲染组件的材质和着色器效果
 * @使用场景
 * 1. 需要动态更换UI元素的shader效果时
 * 2. 需要批量设置材质属性时
 * @示例
 * // 通过数据驱动设置溶解效果：
 * component.onDataChange({
 *   path: 'effects/dissolve', 
 *   defines: { USE_FADE: true },
 *   properties: {
 *     u_dissolveThreshold: [0.5],
 *     u_dissolveColor: [1, 0, 0, 1]
 *   }
 * });
 */
export class SetEffect extends HackUi {
    /** 缓存的UI渲染组件（Sprite/Label等） */
    protected _renderComp: UIRenderer;

    /**
     * 数据变更处理入口
     * @param data 效果配置数据
     * @结构说明
     * - path: 特效资源路径（空值时使用顶点颜色过渡管理器）
     * - defines: 着色器宏定义（控制shader分支）
     * - properties: 材质属性键值对
     * @流程说明
     * 1. 获取UI渲染组件
     * 2. 解析配置数据
     * 3. 调用材质设置方法
     */
    protected onDataChange(data: any) {
        if (!this._renderComp) {
            this._renderComp = this.getComponent(UIRenderer);
            if (!this._renderComp) return;
        }
        // 解构数据参数
        let { path, properties, defines }: { path: string, properties: any, defines: any } = data;
        this.setMaterial(path, defines, properties);
    }

    /**
     * 材质设置核心方法
     * @param path 特效资源路径
     * @param defines 着色器宏定义
     * @param properties 材质属性
     * @流程说明
     * 1. 空路径：使用顶点颜色过渡效果
     * 2. 相同材质：直接更新属性
     * 3. 新材质路径：异步加载并初始化
     * @示例
     * // 加载边缘发光效果
     * setMaterial('effects/outline', { USE_OUTLINE: true }, { u_outlineColor: [1,1,0,1] });
     */
    protected setMaterial(path: string, defines: any, properties: any) {
        if (!path) {
            if (this._renderComp instanceof Sprite) {
                // 使用顶点颜色过渡管理器
                YJVertexColorTransitionManager.ins().add(this._renderComp as Sprite, defines, properties);
            }
            else if (this._renderComp instanceof Skeleton) {
                this.setSkeletonMaterial(defines, properties);
            } else {
                this.setProperties(this._renderComp.material, defines, properties);
                this.work();
            }
        }
        else if (path) {
            // 加载新材质
            no.assetBundleManager.loadEffect(path, item => {
                const material = new Material();
                material.initialize({ effectAsset: item });
                this._renderComp.material = material;
                this.setProperties(this._renderComp.material, defines, properties);
                this.work();
            });
        } else {
            this.reset();
        }
    }

    protected setSkeletonMaterial(defines: any, properties: any) {
        const skeleton = this._renderComp as Skeleton;
        if (skeleton.skeletonData) {
            this.checkSkeletonMaterial(skeleton, defines, properties);
        } else {
            const subSkeleton = skeleton.getComponentInChildren(Skeleton);
            if (subSkeleton?.skeletonData) {
                this.checkSkeletonMaterial(subSkeleton, defines, properties);
            } else {
                this.scheduleOnce(() => {
                    this.setSkeletonMaterial(defines, properties);
                });
            }
        }
    }

    private checkSkeletonMaterial(skeleton: Skeleton, defines: any, properties: any) {
        if (!skeleton.node) {
            this.setSkeletonMaterial(defines, properties);
            return;
        }
        //如果是骨骼动画，则遍历骨骼动画的材质
        const materialCache = skeleton['_materialCache'];
        if (materialCache && Object.keys(materialCache).length > 0) {
            for (const key in materialCache) {
                this.setProperties(materialCache[key], defines, properties);
            }
        }
        else {
            // this.setProperties(skeleton.customMaterial, defines, properties);
            this.scheduleOnce(() => {
                this.checkSkeletonMaterial(skeleton, defines, properties);
            });
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
    protected setProperties(material?: Material, defines?: any, properties?: any) {
        if (!material) return;
        // 设置着色器宏
        if (defines) material.recompileShaders(defines);
        // 设置材质属性
        if (properties) {
            for (const key in properties) {
                if (no.materialHasProperty(material, 0, 0, key)) {
                    let v: number | Vec2 | Vec3 | Vec4;
                    const p = [].concat(properties[key]);
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
     * 计算合图实际区域
     * @流程说明
     * 1. 获取共享材质（避免影响其他实例）
     * 2. 获取精灵帧和纹理
     * 3. 计算实际UV区域和宽高比
     * @注意 适用于Sprite和Label组件
     */
    private caculateFact() {
        // 使用共享材质保证多实例同步
        const material = this._renderComp.sharedMaterial || this._renderComp.material;
        if (!material || !material.effectAsset) return;

        let f: SpriteFrame, texture: Texture2D;
        if (this._renderComp instanceof Sprite) {
            f = this._renderComp.spriteFrame;
            texture = f.texture as Texture2D;
        } else if (this._renderComp instanceof Label) {
            f = this._renderComp['_ttfSpriteFrame'];
            if (!f) return;
            texture = f.texture as Texture2D;
        }

        // 设置实际UV区域（left, bottom, width, height）
        const fr = `factRect`;
        if (no.materialHasProperty(material, 0, 0, fr)) {
            material.setProperty(fr, new Vec4(f.uv[4], f.uv[5], f.uv[2] - f.uv[4], f.uv[3] - f.uv[5]));
        }

        // 设置纹理宽高比
        const r = `ratio`;
        if (no.materialHasProperty(material, 0, 0, r)) {
            material.setProperty(r, texture.width / texture.height);
        }
    }

    /**
     * 材质生效方法
     * @流程说明
     * 1. 获取渲染组件
     * 2. 检查资源就绪状态
     * 3. 延迟重试机制（当资源未加载完成时）
     * 4. 计算材质参数
     * @注意 当spriteFrame未就绪时会自动重试
     */
    public work() {
        if (!this._renderComp) {
            this._renderComp = this.getComponent(UIRenderer);
            if (!this._renderComp) return;
        }
        // 资源未就绪时延迟重试
        if (!this._renderComp['spriteFrame'] && !this._renderComp['_ttfSpriteFrame']) {
            this.scheduleOnce(() => this.work(), 0);
            return;
        }
        this.caculateFact();
    }

    /**
     * 重置材质状态
     * @说明 清除自定义材质，恢复默认渲染
     * @示例
     * // 重置按钮效果
     * buttonEffect.reset();
     */
    public reset(): void {
        this._renderComp.material = null;
        this._renderComp.customMaterial = null;
        this._renderComp.markForUpdateRenderData();
    }
}
