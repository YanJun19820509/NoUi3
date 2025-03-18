
import { ccclass, property, Color } from '../yj';
import { no } from '../no';
import { SetText } from './SetText';

/**
 * Predefined variables
 * Name = SetRichText
 * DateTime = Wed Sep 14 2022 10:38:30 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetRichText.ts
 * FileBasenameNoExtension = SetRichText
 * URL = db://assets/NoUi3/base/richtext/SetRichText.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetRichText')
/**
 * 富文本格式化组件
 * 功能说明：
 * - 继承自SetText，扩展富文本样式功能
 * - 支持颜色、描边、粗体、斜体、下划线等样式组合
 * - 自动将原始文本转换为BBCode格式
 * 
 * @使用示例：
 * // 基础使用
 * this.a_setData("Hello World"); 
 * // 带样式的文本
 * this.color = Color.RED;
 * this.bold = true;
 * this.a_setData("警告信息"); // 输出：[color=#ff0000][b]警告信息[/b][/color]
 */
export class SetRichText extends SetText {
    /**
     * 文字颜色配置
     * @property {Color} color
     * @default Color.BLACK
     * @example 
     * // 设置为红色
     * this.color = Color.RED;
     * // 在BBCode中表现为 [color=#ff0000]...[/color]
     */
    @property
    color: Color = Color.BLACK.clone();

    /**
     * 文字描边颜色配置
     * @property {Color} outlineColor
     * @default Color.BLACK
     * @example
     * // 设置白色描边
     * this.outlineColor = Color.WHITE;
     * // 在BBCode中表现为 [outline color=#ffffff ...]
     */
    @property
    outlineColor: Color = Color.BLACK.clone();

    /**
     * 描边宽度配置
     * @property {number} outlineWidth
     * @min 0
     * @default 1
     * @规则：
     * - 0表示不显示描边
     * - 大于0时才会生成描边BBCode
     */
    @property({ min: 0 })
    outlineWidth: number = 1;

    /** 粗体样式开关 */
    @property({ displayName: '粗体' })
    bold: boolean = false;

    /** 斜体样式开关 */
    @property({ displayName: '斜体' })
    italic: boolean = false;

    /** 下划线样式开关 */
    @property({ displayName: '下划线' })
    underline: boolean = false;

    /**
     * 数据变化处理核心方法
     * @param data 输入文本数据
     * @实现流程：
     * 1. 添加颜色BBCode：优先处理颜色标签作为最外层
     * 2. 处理描边样式：当描边宽度>0时添加outline标签
     * 3. 添加粗体/斜体/下划线等行内样式
     * 4. 调用父类方法完成最终文本设置
     * 
     * @示例处理逻辑：
     * 输入："测试文本"
     * 处理过程：
     * 1. 添加颜色 → [color=#000000]测试文本[/color]
     * 2. 添加描边 → [outline color=#000000 width=1][color...][/outline]
     * 3. 添加粗体 → [b][outline...][/b]
     * 4. 最终结果：<color=...><b><outline...>测试文本</...>
     */
    protected onDataChange(data: any) {
        // 处理基础颜色
        data = no.addBBCode(data, 'color', this.color.toCSS('#rrggbb'));
        
        // 处理描边效果（需要同时满足宽度>0和颜色有效）
        if (this.outlineWidth > 0) {
            data = no.addBBCode(data, 'outline', [
                { key: 'color', value: this.outlineColor.toCSS('#rrggbb') },
                { key: 'width', value: this.outlineWidth }
            ]);
        }

        // 处理文本样式（按BBCode嵌套顺序添加）
        if (this.bold) data = no.addBBCode(data, 'b');     // 粗体最外层
        if (this.italic) data = no.addBBCode(data, 'i');   // 斜体次外层
        if (this.underline) data = no.addBBCode(data, 'u');// 下划线最内层

        // 调用父类方法设置最终文本
        super.onDataChange(data);
    }
}
