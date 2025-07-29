
import { ccclass, menu, property, BlockInputEvents } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetBlockInputEvents
 * DateTime = Mon Jan 17 2022 10:31:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetBlockInputEvents.ts
 * FileBasenameNoExtension = SetBlockInputEvents
 * URL = db://assets/Script/NoUi3/ui/SetBlockInputEvents.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetBlockInputEvents')
@menu('NoUi/ui/SetBlockInputEvents(设置输入拦截:bool)')
/**
 * 输入事件拦截控制组件
 * 
 * @功能说明
 * - 通过数据驱动方式控制输入事件拦截功能
 * - 动态添加/移除 BlockInputEvents 组件
 * - 支持反向控制逻辑（取反输入值）
 * - 自动管理组件状态，避免重复创建组件
 * 
 * @使用示例
 * // 启用输入拦截
 * a_setData(true);  
 * 
 * // 禁用输入拦截
 * a_setData(false);
 * 
 * // 反向控制示例（reverse=true时）
 * a_setData(true);  // 实际会禁用拦截
 * a_setData(false); // 实际会启用拦截
 */
export class SetBlockInputEvents extends HackUi {
    @property({ displayName: '取反' })
    reverse: boolean = false;

    protected onDataChange(data: any) {
        data = Boolean(data);
        if (this.reverse) data = !data;
        let bie = this.getComponent(BlockInputEvents);
        if (data === true) {
            if (bie == null) bie = this.addComponent(BlockInputEvents);
            bie.enabled = true;
        } else {
            if (bie != null) bie.enabled = false;
        }
    }
}
