import { UIRenderer, ccclass, property, menu } from '../yj';
import { HackUi } from './HackUi';
import { rendererUtils } from '../extend/rendererUtils';

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
    @property({ displayName: '是否使用采样2D纹理' })
    isSample2D: boolean = true;
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
        if (data == 'null') {
            this.reset();
            return;
        }
        rendererUtils.shader(this._renderComp, data, this.isSample2D);
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
