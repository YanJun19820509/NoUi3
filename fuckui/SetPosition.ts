
import { _decorator } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetPosition
 * DateTime = Mon Jan 17 2022 12:08:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPosition.ts
 * FileBasenameNoExtension = SetPosition
 * URL = db://assets/Script/NoUi3/fuckui/SetPosition.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPosition')
@menu('NoUi/ui/SetPosition(设置坐标:object|array)')
export class SetPosition extends FuckUi {

    protected onDataChange(data: any) {
        let a = [];
        for (const key in data) {
            a[a.length] = data[key];
        }
        no.x(this.node, a[0]);
        no.y(this.node, a[1]);
    }
}
