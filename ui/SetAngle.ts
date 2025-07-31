import { ccclass, menu, property } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetAngle
 * DateTime = Mon Jan 17 2022 09:58:42 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAngle.ts
 * FileBasenameNoExtension = SetAngle
 * URL = db://assets/Script/NoUi3/HackUi/SetAngle.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetAngle')
@menu('NoUi/ui/SetAngle(设置旋转角度:number)')
export class SetAngle extends HackUi {
    @property({ displayName: '反向', tooltip: '反向' })
    reverse: boolean = false;
    protected onDataChange(data: any) {
        const a = Number(data);
        this.node.angle = this.reverse ? -a : a;
    }
}
