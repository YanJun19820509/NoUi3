
import { ccclass, menu } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetAngle
 * DateTime = Mon Jan 17 2022 09:58:42 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAngle.ts
 * FileBasenameNoExtension = SetAngle
 * URL = db://assets/Script/NoUi3/fuckui/SetAngle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetAngle')
@menu('NoUi/ui/SetAngle(设置旋转角度:number)')
export class SetAngle extends FuckUi {
    protected onDataChange(data: any) {
        this.node.angle = Number(data);
    }
}
