
import { ccclass, menu, requireComponent, UIOpacity } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetOpacity
 * DateTime = Mon Jan 17 2022 11:59:23 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetOpacity.ts
 * FileBasenameNoExtension = SetOpacity
 * URL = db://assets/Script/NoUi3/ui/SetOpacity.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetOpacity')
@menu('NoUi/ui/SetOpacity(设置透明度:number)')
@requireComponent(UIOpacity)
/**
 * 节点透明度控制组件
 * @功能说明
 * - 通过数据驱动方式设置节点透明度
 * - 需要依赖UIOpacity组件
 * 
 * @使用示例
 * // 在属性检查器中：
 * // 1. 确保节点已添加UIOpacity组件
 * // 2. 通过发送数据事件设置透明度：
 * 
 * // 设置半透明（0-255范围会自动转换到0-1范围）
 * this.node.emit('data', 128); 
 * 
 * // 直接使用0-1范围值
 * this.node.emit('data', 0.5);
 * 
 * // 支持字符串格式的数值
 * this.node.emit('data', "0.8");
 */
export class SetOpacity extends HackUi {

    /**
     * 数据变化处理函数
     * @param data 透明度数值，支持以下类型：
     * - number类型：0-1范围的小数 或 0-255范围的整数
     * - string类型：可转换为数字的字符串
     * @处理逻辑
     * 1. 将输入数据转换为Number类型
     * 2. 自动处理0-255到0-1范围的转换
     * 3. 最终值会被限制在0-1之间
     */
    protected onDataChange(data: any) {
        // 使用Number强制转换保证数据类型安全
        // no.opacity内部已处理不同范围的数值转换
        no.opacity(this.node, Number(data));
    }
}
