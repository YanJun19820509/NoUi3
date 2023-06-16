import { ccclass, menu } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetPositionY
 * DateTime = Mon Jan 17 2022 12:10:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPositionY.ts
 * FileBasenameNoExtension = SetPositionY
 * URL = db://assets/Script/NoUi3/fuckui/SetPositionY.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPositionY')
@menu('NoUi/ui/SetPositionY(设置y坐标:number)')
export class SetPositionY extends FuckUi {

    protected onDataChange(data: any) {
        no.y(this.node, Number(data));
    }
}
