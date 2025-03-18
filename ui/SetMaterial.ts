import { EDITOR, Material, UIRenderer, ccclass, property } from '../../NoUi3/yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * 动态设置材质
 * Author mqsy_yj
 * DateTime Thu Apr 11 2024 16:52:44 GMT+0800 (中国标准时间)
 * data: string 材质的url
 */

@ccclass('SetMaterial')
/**
 * 动态材质设置组件
 * @功能说明
 * - 管理UI渲染器的自定义材质
 * - 支持运行时动态加载/切换材质
 * - 提供材质重置和移除功能
 * @示例
 * // 通过数据驱动切换材质：
 * this.node.getComponent(SetMaterial).a_setData('textures/red');
 */
export class SetMaterial extends HackUi {

    @property({ tooltip: '默认材质资源路径' })
    defaultMaterialUrl: string = '';
    @property({ visible: false })
    _defaultMateriaUuid: string = '';

    /**
     * 组件加载生命周期回调
     * @功能说明
     * - 在运行时初始化默认材质
     * @示例
     * // 非编辑器环境下：
     * // 自动加载并应用defaultMaterialUrl指定的材质
     */
    onLoad() {
        super.onLoad();
        if (!EDITOR)
            this.resetMaterial();
    }

    /**
     * 处理数据变更
     * @param data 材质资源路径或配置数据
     * @示例
     * // 设置新材质：
     * component.a_setData('effects/glow')
     */
    protected onDataChange(data: any) {
        this.loadMaterial(data);
    }

    /**
     * 异步加载并应用材质
     * @param url 材质资源路径
     * @流程说明
     * 1. 通过资源管理系统加载材质
     * 2. 获取UIRenderer组件
     * 3. 应用新材质到渲染器
     * @示例
     * // 加载发光材质：
     * this.loadMaterial('effects/glow');
     */
    private loadMaterial(url: string) {
        no.assetBundleManager.loadMaterial(url, material => {
            const render = this.getComponent(UIRenderer);
            if (render)
                render.customMaterial = material;
        });
    }

    /**
     * 编辑器模式更新逻辑
     * @功能说明
     * - 自动记录默认材质的资源路径
     * - 同步材质UUID与资源路径的对应关系
     */
    update() {
        if (EDITOR) {
            const material = this.getComponent(UIRenderer)?.customMaterial;
            if (material && !this.defaultMaterialUrl) {
                this._defaultMateriaUuid = material.uuid;
                no.EditorMode.getAssetUrlByUuid(material.uuid).then(url => {
                    this.defaultMaterialUrl = url;
                });
            }
        }
    }

    /**
     * 重置为默认材质
     * @功能说明
     * - 根据记录的UUID重新加载默认材质
     * @示例
     * // 恢复初始材质：
     * this.getComponent(SetMaterial).resetMaterial();
     */
    public resetMaterial() {
        if (this.defaultMaterialUrl) {
            no.assetBundleManager.loadAny<Material>({ uuid: this._defaultMateriaUuid, type: Material }, material => {
                const render = this.getComponent(UIRenderer);
                if (render)
                    render.customMaterial = material;
            });
        }
    }

    /**
     * 移除当前材质
     * @功能说明
     * - 清空自定义材质设置
     * - 恢复默认材质渲染
     * @示例
     * // 取消材质效果：
     * this.getComponent(SetMaterial).removeMaterial();
     */
    public removeMaterial() {
        const render = this.getComponent(UIRenderer);
        if (render)
            render.customMaterial = null;
    }
}
