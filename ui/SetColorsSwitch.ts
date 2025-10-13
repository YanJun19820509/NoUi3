
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { ccclass, property, menu, Color, UIRenderer, Component, LabelOutline } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetColorsSwitch
 * DateTime = Mon Jan 17 2022 10:38:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetColorsSwitch.ts
 * FileBasenameNoExtension = SetColorsSwitch
 * URL = db://assets/Script/NoUi3/ui/SetColorsSwitch.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
@ccclass('ColorInfo')
/**
 * 颜色配置信息类
 * 
 * @配置说明
 * - 每个实例表示一个颜色状态配置
 * - 用于根据条件值匹配对应的颜色方案
 * - 支持同时设置字体颜色和描边颜色
 * 
 * @示例
 * // 配置当条件为"warning"时的颜色方案：
 * condition: "warning"
 * color: #FFFF00 (黄色)
 * isLabel: true 
 * outlineColor: #000000 (黑色描边)
 */
export class ColorInfo {
    /**
     * 匹配条件值
     * @配置说明 
     * - 与传入的data值进行严格匹配
     * - 支持字符串/数字等基础类型
     */
    @property
    condition: string = '';

    /**
     * 主颜色配置
     * @配置说明
     * - 设置字体颜色或UI元素主颜色
     * - 默认白色，可通过颜色选择器配置
     */
    @property
    color: Color = Color.WHITE.clone();

    /**
     * 是否为文本类型
     * @配置说明
     * - true: 需要同时设置描边颜色
     * - false: 仅设置主颜色（默认）
     */
    @property
    isLabel: boolean = false;

    /**
     * 描边颜色配置
     * @配置说明
     * - 当isLabel为true时显示并生效
     * - 需要与color配合使用形成对比
     */
    @property({ visible() { return this.isLabel; } })
    outlineColor: Color = Color.WHITE.clone();

    /**
     * 应用颜色到指定组件
     * @param comp 目标渲染组件，可以是：
     * - YJCharLabel: 自定义字符标签组件
     * - UIRenderer: Cocos基础渲染组件
     * - 包含LabelOutline组件的节点
     * 
     * @实现逻辑
     * 1. 对YJCharLabel特殊处理字体和描边
     * 2. 普通UI组件设置color属性
     * 3. 当需要描边时查找LabelOutline组件
     * 
     * @示例
     * // 应用到普通Label节点：
     * setColor(labelComponent); // 设置字体颜色
     * 
     * // 应用到YJCharLabel节点：
     * setColor(charLabel); // 同时设置字体和描边
     */
    public setColor(comp: UIRenderer) {
        // 处理自定义字符标签组件
        if (comp instanceof YJCharLabel) {
            comp.fontColor = this.color;
            // 需要时设置描边颜色
            if (this.isLabel) comp.outlineColor = this.outlineColor;
        } else {
            // 设置普通UI组件颜色
            comp.color = this.color;
            // 查找并设置描边组件
            if (this.isLabel && comp.getComponent(LabelOutline))
                comp.getComponent(LabelOutline).color = this.outlineColor;
        }
        if (comp.renderData)
            comp.renderData.vertDirty = true;
    }
}

@ccclass('SetColorsSwitch')
@menu('NoUi/ui/SetColorsSwitch(根据条件切换颜色:string)')
/**
 * 颜色切换组件
 * 
 * @功能说明
 * - 根据条件值匹配对应的颜色配置
 * - 支持同时设置字体颜色和描边颜色
 * - 可递归影响所有子节点的颜色
 * - 自动适配YJCharLabel和原生UI组件
 * 
 * @使用示例
 * // 编辑器配置：
 * - 添加条件为"warning"的ColorInfo，设置颜色为黄色
 * - 设置recursive为true影响所有子节点
 * 
 * // 代码调用：
 * a_setData("warning"); // 切换为警告色
 * a_setData("normal");  // 切换为正常颜色
 */
export class SetColorsSwitch extends HackUi {
    /**
     * 颜色配置数组
     * @配置说明
     * - condition: 匹配条件字符串
     * - color: 主颜色（字体/UI元素颜色）
     * - isLabel: 是否同时设置描边颜色
     * - outlineColor: 描边颜色（isLabel为true时生效）
     */
    @property({ type: ColorInfo, displayName: '状态信息' })
    infos: ColorInfo[] = [];

    /**
     * 递归控制开关
     * @功能说明
     * - true: 影响当前节点及其所有子节点
     * - false: 仅影响当前节点（默认）
     */
    @property({ displayName: '影响子节点' })
    recursive: boolean = false;

    /**
     * 数据驱动颜色切换方法
     * @param data 输入的条件值，支持类型：
     * - 任意类型数据，最终会转换为字符串进行匹配
     * 
     * @实现流程
     * 1. 将输入数据转换为字符串类型
     * 2. 遍历infos数组寻找condition匹配项
     * 3. 找到匹配项后：
     *    - 设置当前节点颜色
     *    - 根据recursive设置子节点颜色
     * 4. 找到第一个匹配项后立即停止搜索
     */
    protected onDataChange(data: any) {
        // 统一转换为字符串进行条件匹配
        const condition = String(data);

        // 遍历所有颜色配置寻找匹配项
        for (let i = 0, n = this.infos.length; i < n; i++) {
            const info = this.infos[i];
            if (info.condition === condition) {
                // 设置当前节点颜色
                this.setColor(info, this.node.getComponent(UIRenderer));

                // 递归设置子节点颜色
                if (this.recursive) {
                    const children = this.node.children;
                    for (let index = 0; index < children.length; index++) {
                        const child = children[index];
                        this.setColor(info, child.getComponent(UIRenderer));
                    }
                }
                break; // 找到第一个匹配项后立即退出循环
            }
        }
    }

    /**
     * 颜色应用方法
     * @param info 颜色配置信息
     * @param comp 目标UI渲染组件
     * 
     * @实现说明
     * - 优先处理YJCharLabel自定义组件
     * - 其次处理原生LabelOutline组件
     * - 最后处理普通UIRenderer组件
     */
    private setColor(info: ColorInfo, comp: UIRenderer) {
        info.setColor(comp);
    }
}
