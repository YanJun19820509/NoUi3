
import { ccclass, property, menu } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetClickEventWithState
 * DateTime = Mon Jan 17 2022 10:35:02 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetClickEventWithState.ts
 * FileBasenameNoExtension = SetClickEventWithState
 * URL = db://assets/Script/NoUi3/ui/SetClickEventWithState.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetClickEventWithStateInfo')
export class SetClickEventWithStateInfo {
    @property
    stateVal: string = '';
    @property(no.EventHandlerInfo)
    onClick: no.EventHandlerInfo[] = [];
}

@ccclass('SetClickEventWithState')
@menu('NoUi/ui/SetClickEventWithState(点击时根据状态调用不同的事件:string|number)')
/**
 * 带状态的点击事件处理组件
 * 
 * @功能说明
 * - 根据当前状态值执行不同的点击事件处理器
 * - 支持多状态配置，每个状态对应独立的事件列表
 * - 通过数据驱动方式动态切换当前状态
 * - 自动匹配字符串/数字类型的松散相等比较
 *
 * @使用示例
 * // 配置状态为"attack"时的事件
 * a_setData("attack");
 * 
 * // 配置状态为数字1时的事件
 * a_setData(1);
 * 
 * // 未匹配到状态时不会触发任何事件
 * a_setData("invalid_state");
 */
export class SetClickEventWithState extends HackUi {
    /**
     * 状态配置数组
     * @配置说明
     * - 每个元素包含状态值和对应的事件处理器列表
     * - 支持在编辑器中可视化配置
     * - 状态值支持字符串和数字类型
     */
    @property({ type: SetClickEventWithStateInfo })
    states: SetClickEventWithStateInfo[] = [];

    // 当前生效的状态配置
    private _cur: SetClickEventWithStateInfo;

    /**
     * 状态更新处理方法
     * @param data 输入的状态值，支持类型：
     * - string: 直接匹配stateVal字段
     * - number: 自动转换为字符串进行宽松匹配
     * - 其他类型: 会尝试转换为字符串进行匹配
     * 
     * @实现说明
     * 1. 使用宽松相等比较（==）允许数字和字符串的互匹配
     * 2. 找到第一个匹配项后立即停止搜索
     * 3. 未找到匹配项时保持当前状态不变
     */
    protected onDataChange(data: any) {
        // 遍历所有状态配置寻找匹配项
        for (let i = 0, n = this.states.length; i < n; i++) {
            const info = this.states[i];
            // 使用宽松相等比较，支持数字和字符串的互匹配
            if (info.stateVal == data) {
                this._cur = info;
                break; // 找到第一个匹配项后立即退出循环
            }
        }
    }

    /**
     * 点击事件触发入口
     * @执行逻辑
     * - 当存在有效状态配置时，执行该状态下的所有事件处理器
     * - 未配置或未匹配到状态时不执行任何操作
     * 
     * @使用示例
     * // 当配置了"attack"状态时：
     * node.click() → 触发attack状态的事件处理器
     */
    public a_onClick() {
        // 执行当前状态对应的事件处理器
        no.EventHandlerInfo.execute(this._cur?.onClick);
    }
}
