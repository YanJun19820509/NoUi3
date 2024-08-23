
import { ccclass, menu, requireComponent, UIOpacity } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetOpacity
 * DateTime = Mon Jan 17 2022 11:59:23 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetOpacity.ts
 * FileBasenameNoExtension = SetOpacity
 * URL = db://assets/Script/NoUi3/fuckui/SetOpacity.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetOpacity')
@menu('NoUi/ui/SetOpacity(设置透明度:number)')
@requireComponent(UIOpacity)
export class SetOpacity extends FuckUi {

    protected onDataChange(data: any) {
        no.opacity(this.node, Number(data));
    }
}
