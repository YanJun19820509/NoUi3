
import { ccclass, property, menu, Button } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetInteractable
 * DateTime = Mon Jan 17 2022 10:54:19 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetInteractable.ts
 * FileBasenameNoExtension = SetInteractable
 * URL = db://assets/Script/common/ui/SetInteractable.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetInteractable')
@menu('NoUi/ui/SetInteractable(设置交互状态:boolean)')
/**
 * 按钮交互状态控制组件
 * 
 * @功能说明
 * - 控制Button组件的交互状态（启用/禁用）
 * - 支持反向控制逻辑（reverse=true时数据取反）
 * 
 * @使用示例
 * // 直接控制模式
 * this.btnControl.data = true; // 启用按钮
 * this.btnControl.data = false; // 禁用按钮
 * 
 * // 反向控制模式
 * this.btnControl.reverse = true;
 * this.btnControl.data = true; // 实际会禁用按钮
 */
export class SetInteractable extends HackUi {

    @property({ displayName: '取反' })
    reverse: boolean = false;

    /**
     * 数据变化处理函数
     * @param data 输入数据，将被转换为布尔值
     * @流程说明
     * 1. 检查Button组件是否存在
     * 2. 转换数据为布尔类型
     * 3. 根据reverse属性反转控制逻辑
     * 4. 调用对应方法设置交互状态
     * 
     * @示例
     * onDataChange(true) -> 启用按钮（reverse=false时）
     * onDataChange(0) -> 禁用按钮（reverse=false时）
     */
    protected onDataChange(data: any) {
        // 确保目标节点有Button组件
        if (!this.getComponent(Button)) return;
        // 转换输入数据为布尔值
        data = Boolean(data);
        // 应用反向控制逻辑
        if (this.reverse) data = !data;
        // 根据结果调用对应方法
        data ? this.a_enable() : this.a_disable();
    }

    /**
     * 启用按钮交互
     * @说明 设置Button组件的interactable属性为true
     */
    public a_enable(): void {
        this.getComponent(Button).interactable = true;
    }

    /**
     * 禁用按钮交互
     * @说明 设置Button组件的interactable属性为false
     */
    public a_disable(): void {
        this.getComponent(Button).interactable = false;
    }
}
