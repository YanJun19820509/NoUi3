
import { ccclass, menu, property, BlockInputEvents } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetBlockInputEvents
 * DateTime = Mon Jan 17 2022 10:31:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetBlockInputEvents.ts
 * FileBasenameNoExtension = SetBlockInputEvents
 * URL = db://assets/Script/NoUi3/fuckui/SetBlockInputEvents.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetBlockInputEvents')
@menu('NoUi/ui/SetBlockInputEvents(设置输入拦截:bool)')
export class SetBlockInputEvents extends FuckUi {
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
