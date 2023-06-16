
import { ccclass, menu } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetScale
 * DateTime = Mon Jan 17 2022 14:00:49 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScale.ts
 * FileBasenameNoExtension = SetScale
 * URL = db://assets/Script/NoUi3/fuckui/SetScale.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScale')
@menu('NoUi/ui/SetScale(设置scale:number|[number])')
export class SetScale extends FuckUi {

    protected onDataChange(data: any) {
        if (data instanceof Array)
            this.node.setScale(data[0], data[1] || data[0], data[2]);
        else this.node.setScale(data, data, data);
    }
}
