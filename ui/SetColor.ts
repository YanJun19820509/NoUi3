
import { ccclass, menu, Color, UIRenderer, property, LabelOutline } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';

/**
 * Predefined variables
 * Name = SetColor
 * DateTime = Mon Jan 17 2022 10:35:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetColor.ts
 * FileBasenameNoExtension = SetColor
 * URL = db://assets/Script/NoUi3/ui/SetColor.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetColor')
@menu('NoUi/ui/SetColor(设置颜色:string|cc.Color)')
/**
 * 颜色设置组件
 * 
 * @功能说明
 * - 支持通过字符串或Color实例设置颜色
 * - 可同时处理普通UI元素颜色和文本描边颜色
 * - 自动适配不同类型的渲染组件：
 *   - 优先处理YJCharLabel自定义组件
 *   - 其次处理Cocos原生组件（LabelOutline/UIRenderer）
 * 
 * @使用示例
 * // 设置字体颜色为红色
 * a_setData("#ff0000"); 
 * a_setData(new Color(255,0,0));
 * 
 * // 设置描边颜色为蓝色
 * a_setData({ isOutline: true }); // 先切换模式
 * a_setData("#0000ff");
 */
export class SetColor extends HackUi {
    /**
     * 颜色模式开关
     * @配置说明
     * - true: 设置文本描边颜色
     * - false: 设置字体/渲染器颜色（默认模式）
     */
    @property({ displayName: '设置文本描边' })
    isOutline: boolean = false;

    /**
     * 数据驱动颜色更新方法
     * @param data 颜色数据，支持类型：
     * - 16进制颜色字符串（如"#ff0000"）
     * - Color实例
     * 
     * @实现流程
     * 1. 转换输入数据为Color对象
     * 2. 根据isOutline模式选择目标组件：
     *    - 描边模式：YJCharLabel > LabelOutline
     *    - 普通模式：YJCharLabel > UIRenderer
     * 3. 对找到的第一个有效组件应用颜色
     */
    protected onDataChange(data: any) {
        let color: Color;
        // 转换输入数据为颜色对象
        if (typeof data == 'string') {
            color = no.str2Color(data);
        } else if (data instanceof Color) {
            color = data;
        }

        // 根据模式选择目标组件并应用颜色
        if (this.isOutline) {
            if (this.getComponent(YJCharLabel)) {
                this.getComponent(YJCharLabel).outlineColor = color;
            } else if (this.getComponent(LabelOutline)) {
                this.getComponent(LabelOutline).color = color;
            }
        } else {
            if (this.getComponent(YJCharLabel)) {
                this.getComponent(YJCharLabel).fontColor = color;
            } else if (this.getComponent(UIRenderer)) {
                this.getComponent(UIRenderer).color = color;
            }
        }
    }
}
