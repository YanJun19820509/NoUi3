
import { ccclass, property, Component, Node } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJGoToTarget
 * DateTime = Fri Jun 24 2022 12:10:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGoToTarget.ts
 * FileBasenameNoExtension = YJGoToTarget
 * URL = db://assets/NoUi3/base/goto/YJGoToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJGoToTarget')
export class YJGoToTarget extends Component {
    @property(no.EventHandlerInfo)
    cbs: no.EventHandlerInfo[] = [];
    @property({ displayName: '延时执行(s)', min: 0 })
    delay: number = 0;

    public trigger(args: any): void {
        this.scheduleOnce(() => {
            no.EventHandlerInfo.execute(this.cbs, args);
        }, this.delay);
    }

}
