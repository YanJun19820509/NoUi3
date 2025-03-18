
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
 * URL = db://assets/NoUi3/ui/SetToggleManagerCheckedToggle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetToggleManagerCheckedToggle')
@requireComponent(YJToggleGroupManager)
export class SetToggleManagerCheckedToggle extends HackUi {
    onDataChange(d: any) {
        this.getComponent(YJToggleGroupManager).a_check(Number(d));
    }
}
