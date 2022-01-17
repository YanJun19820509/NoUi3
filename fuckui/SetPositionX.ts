
import { _decorator } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetPositionX
 * DateTime = Mon Jan 17 2022 12:10:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPositionX.ts
 * FileBasenameNoExtension = SetPositionX
 * URL = db://assets/Script/NoUi3/fuckui/SetPositionX.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPositionX')
@menu('NoUi/ui/SetPositionX(设置x坐标:number)')
export class SetPositionX extends FuckUi {

    protected onDataChange(data: any) {
        no.x(this.node, Number(data));
    }
}
