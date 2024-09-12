
import { ccclass, menu, v3 } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

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
        const oldPos = no.position(this.node),
            posKeys = ['x', 'y', 'z'];
        let a = [];
        if (data instanceof Array) {
            for (let i = 0; i < 3; i++) {
                a[i] = data[i] != null ? data[i] : oldPos[posKeys[i]];
            }
        } else {
            for (let i = 0; i < 3; i++) {
                const k = posKeys[i];
                a[i] = data[k] != null ? data[k] : oldPos[k];
            }
        }
        no.position(this.node, v3(...a));
    }
}
