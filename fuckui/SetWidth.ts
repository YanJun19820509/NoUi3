
import { _decorator } from './yj';
import { no } from '../no';
import { SetHeight } from './SetHeight';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetWidth
 * DateTime = Mon Jan 17 2022 14:46:14 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetWidth.ts
 * FileBasenameNoExtension = SetWidth
 * URL = db://assets/Script/NoUi3/fuckui/SetWidth.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetWidth')
@menu('NoUi/ui/SetWidth(设置宽:number)')
export class SetWidth extends SetHeight {

    protected onDataChange(data: any) {
        no.width(this.node, this.caculate(data));
    }
}
