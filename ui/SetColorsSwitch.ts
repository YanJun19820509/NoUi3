import { ccclass, property, menu, Color, UIRenderer, LabelOutline, Node, LabelShadow } from '../yj';
import { rendererUtils } from './assemble/rendererUtils';
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

    private _conditions: string[];
    public matchCondition(condition: string) {
        if (!this._conditions) {
            this._conditions = this.condition.split(',');
        }
        return this._conditions.includes(condition);
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

    @property({ displayName: '设置文本描边' })
    isOutline: boolean = false;
    @property({ displayName: '设置文本阴影' })
    isShadow: boolean = false;
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

        let info: ColorInfo;
        let children: Node[];
        let child: Node;
        // 遍历所有颜色配置寻找匹配项
        for (let i = 0, n = this.infos.length; i < n; i++) {
            info = this.infos[i];
            if (info.matchCondition(condition)) {
                // 设置当前节点颜色
                this.setColor(info, this.node);

                // 递归设置子节点颜色
                if (this.recursive) {
                    children = this.node.children;
                    for (let index = 0, m = children.length; index < m; index++) {
                        child = children[index];
                        this.setColor(info, child);
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
    private setColor(info: ColorInfo, node: Node) {
        let comp: LabelOutline | UIRenderer | LabelShadow;
        if (this.isOutline) {
            comp = node.getComponent(LabelOutline);
        } else if (this.isShadow) {
            comp = node.getComponent(LabelShadow);
        } else {
            comp = node.getComponent(UIRenderer);
        }
        if (!comp) return;
        rendererUtils.color(comp, info.color);
    }
}
