

import { ccclass, property, requireComponent } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { FuckUi } from './FuckUi';
import { no } from '../no';

/**
 * Predefined variables
 * Name = setNodeTarget
 * DateTime = Tue Jun 14 2022 10:34:56 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = setNodeTarget.ts
 * FileBasenameNoExtension = setNodeTarget
 * URL = db://assets/NoUi3/fuckui/setNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetNodeTarget')
@requireComponent(YJNodeTarget)
export class SetNodeTarget extends FuckUi {

    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';

    protected onDataChange(data: any) {
        let s = '';
        if (typeof data == 'string') {
            if (data != '')
                s = no.formatString(this.formatter, data.split('|'));
        } else if (typeof data == 'number') {
            s = no.formatString(this.formatter, { '0': data });
        } else {
            s = no.formatString(this.formatter, data);
        }
        this.getComponent(YJNodeTarget).setType(s);
    }
}
