import { YJSliderButton } from "../widget/sliderButton/YJSliderButton";
import { ccclass, property, requireComponent } from "../yj";
import { HackUi } from "./HackUi";
/**
 * Predefined variables
 * Name = SetSliderButtonChecked
 * DateTime = Sat Jul 15 2023 14:14:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSliderButtonChecked.ts
 * FileBasenameNoExtension = SetSliderButtonChecked
 * URL = db://assets/NoUi3/ui/SetSliderButtonChecked.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSliderButtonChecked')
@requireComponent(YJSliderButton)
/**
 * 滑动按钮状态控制组件
 * 功能说明：
 * - 通过数据驱动方式控制YJSliderButton的选中状态
 * - 提供两种状态变更模式（是否触发状态变更事件）
 * 
 * @使用示例：
 * // 静默设置按钮为选中状态（不触发变更事件）
 * this.a_setData({ noChangeEvent: true, checked: true });
 * // 常规设置按钮选中状态（触发变更事件）
 * this.a_setData(true);
 */
export class SetSliderButtonChecked extends HackUi {
    /**
     * 是否禁止触发状态变更事件
     * @规则：
     * - true: 使用isCheckedNoChange属性设置状态，不会触发按钮的onCheck事件
     * - false: 使用常规isChecked属性设置状态，会触发按钮的onCheck事件
     * @示例 
     * this.noChangeEvent = true // 静默修改按钮状态
     */
    @property({ tooltip: '修改状态时不触发变更事件' })
    noChangeEvent: boolean = false;

    /**
     * 数据变化处理函数
     * @param data 支持多种格式：
     * - boolean: 直接设置选中状态
     * - object: 复合参数 { noChangeEvent: boolean, checked: boolean }
     * @示例
     * // 直接设置选中状态为true并触发事件
     * this.onDataChange(true)
     * // 使用对象参数静默设置未选中状态
     * this.onDataChange({ noChangeEvent: true, checked: false })
     */
    protected onDataChange(data: any): void {
        // 当传入对象参数时，支持动态覆盖noChangeEvent设置
        const useNoChange = data?.noChangeEvent !== undefined ? data.noChangeEvent : this.noChangeEvent;
        const targetValue = data?.checked !== undefined ? data.checked : data;
        
        // 获取关联的滑动按钮组件
        const sliderButton = this.getComponent(YJSliderButton);
        // 根据模式设置状态
        if (useNoChange) {
            sliderButton.isCheckedNoChange = Boolean(targetValue);
        } else {
            sliderButton.isChecked = Boolean(targetValue);
        }
    }
}
