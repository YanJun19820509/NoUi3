
import { ccclass, requireComponent } from '../yj';
import { YJToggleGroupManager } from '../base/node/YJToggleGroupManager';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetToggleManagerCheckedToggle
 * DateTime = Wed Dec 28 2022 16:17:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetToggleManagerCheckedToggle.ts
 * FileBasenameNoExtension = SetToggleManagerCheckedToggle
 * URL = db://assets/common/ui/SetToggleManagerCheckedToggle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetToggleManagerCheckedToggle')
@requireComponent(YJToggleGroupManager)
/**
 * Toggle组管理组件 - 选中状态控制
 * @功能说明：
 * - 通过数据驱动设置ToggleGroup中指定索引的Toggle为选中状态
 * - 自动关联YJToggleGroupManager组件
 * 
 * @使用示例：
 * // 通过数据绑定设置选中第2个Toggle（索引从0开始）：
 * this.a_setData(1) 
 * 
 * // 通过字符串数字设置：
 * this.a_setData("2") // 将选中索引为2的Toggle
 */
export class SetToggleManagerCheckedToggle extends HackUi {
    /**
     * 数据变更处理回调
     * @param d 要选中的Toggle索引值，支持类型：
     * - number: 直接作为索引使用
     * - string: 转换为数字后作为索引
     * @实现原理：
     * - 获取YJToggleGroupManager组件
     * - 调用a_check方法设置指定索引的Toggle为选中状态
     * - 自动处理数字类型转换保证健壮性
     */
    onDataChange(d: any) {
        // 转换为数字类型后调用Toggle组管理器的选中方法
        this.getComponent(YJToggleGroupManager).a_check(Number(d));
    }
}
