
import { _decorator, Component, Node } from 'cc';
import { no } from '../../no';
const { ccclass, property } = _decorator;

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

    public trigger(args: any): void {
        no.EventHandlerInfo.execute(this.cbs, args);
    }

}
