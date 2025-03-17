
import { ccclass, property, menu, requireComponent, Component, EffectAsset } from '../../yj';
import { SetEffect } from '../../fuckui/SetEffect';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJSetShaderProperties
 * DateTime = Fri Jan 14 2022 16:37:20 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetShaderProperties.ts
 * FileBasenameNoExtension = YJSetShaderProperties
 * URL = db://assets/Script/NoUi3/base/shader/YJSetShaderProperties.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('DefineInfo')
export class DefineInfo {
    @property
    type: string = '';
    @property
    isWork: boolean = false;
}

@ccclass('PropertyInfo')
export class PropertyInfo {
    @property
    type: string = '';
    @property({ step: 0.01 })
    value: number = 0.0;
}

@ccclass('YJSetShaderProperties')
@menu('NoUi/shader/YJSetShaderProperties(设置shader属性)')
@requireComponent(SetEffect)
export class YJSetShaderProperties extends Component {
    /**
     * Effect资源获取器（编辑器专用）
     * @desc 
     * - 在编辑器中拖拽Effect资源时自动解析资源路径
     * - 运行时始终返回null
     * - 实际路径存储在path属性中
     * @example
     * // 在编辑器中使用：
     * 1. 拖拽Effect资源到该属性框
     * 2. 自动解析并存储资源路径到path属性
     */
    @property({ type: EffectAsset })
    public get effectAsset(): EffectAsset {
        return null;
    }

    public set effectAsset(v: EffectAsset) {
        // 编辑器模式下通过UUID获取资源路径
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            if (!url) return;
            this.path = url;
        });
    }

    /**
     * 资源路径显示（只读）
     * @desc 
     * - 显示当前使用的Effect资源路径
     * - 格式为'db://assets/...'的完整路径
     * - 用于调试和验证资源加载
     */
    @property({ readonly: true })
    path: string = '';

    /**
     * 宏定义配置列表
     * @type {DefineInfo[]}
     * @desc 
     * - 配置Shader中使用的预处理宏定义
     * - 每个条目包含宏名称(type)和启用状态(isWork)
     * @example
     * // 配置示例：
     * [{ type: 'USE_NORMAL_MAP', isWork: true }]
     */
    @property(DefineInfo)
    defines: DefineInfo[] = [];

    /**
     * 属性参数配置列表
     * @type {PropertyInfo[]}
     * @desc 
     * - 配置Shader的uniform参数值
     * - 支持数值类型属性（float/int）
     * - 每个条目包含属性名称(type)和数值(value)
     * @example
     * // 配置示例：
     * [{ type: 'u_glowPower', value: 1.5 }]
     */
    @property(PropertyInfo)
    properties: PropertyInfo[] = [];

    /**
     * 组件启用生命周期
     * @desc 组件激活时自动应用Shader配置
     */
    onEnable() {
        this.setEffect();
    }

    /**
     * 应用Shader配置
     * @desc 
     * - 收集所有属性参数和宏定义
     * - 通过SetEffect组件应用配置
     * - 执行流程：
     *   1. 校验资源路径有效性
     *   2. 创建属性参数字典
     *   3. 创建宏定义状态字典
     *   4. 组合配置数据并提交
     */
    private setEffect() {
        if (this.path == '') return;
        
        // 获取SetEffect组件实例
        const setEffectComp = this.getComponent(SetEffect);
        
        // 构建属性参数字典 {uniform名称: 数值}
        const uniformValues = {};
        for (let i = 0; i < this.properties.length; i++) {
            const p = this.properties[i];
            uniformValues[p.type] = p.value;
        }

        // 构建宏定义字典 {宏名称: 是否启用}
        const macroStates = {};
        for (let i = 0; i < this.defines.length; i++) {
            const d = this.defines[i];
            macroStates[d.type] = d.isWork;
        }

        // 组合完整配置数据
        const configData = {
            path: this.path,
            properties: uniformValues,
            defines: macroStates
        };
        
        // 提交配置到SetEffect组件
        setEffectComp.a_setData(configData);
    }
}
