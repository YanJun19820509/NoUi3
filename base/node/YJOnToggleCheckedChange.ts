
import { _decorator, Component, isValid, Node, Toggle } from './yj';
import { no } from '../../no';
import { YJJobManager } from '../YJJobManager';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJOnToggleCheckedChange
 * DateTime = Mon Jun 13 2022 14:03:05 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJOnToggleCheckedChange.ts
 * FileBasenameNoExtension = YJOnToggleCheckedChange
 * URL = db://assets/NoUi3/base/node/YJOnToggleCheckedChange.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJOnToggleCheckedChange')
@requireComponent([Toggle])
export class YJOnToggleCheckedChange extends Component {
    @property({ tooltip: '受默认状态影响' })
    checkDefault: boolean = true;
    @property(no.EventHandlerInfo)
    onChecked: no.EventHandlerInfo[] = [];
    @property(no.EventHandlerInfo)
    onNotChecked: no.EventHandlerInfo[] = [];

    private lastState: boolean;
    onLoad() {
        if (!this.checkDefault)
            this.lastState = this.getComponent(Toggle).isChecked;
    }

    protected start(): void {
        YJJobManager.ins.execute(this.check, this);
    }

    private check() {
        if (!isValid(this?.node)) return false;
        let isChecked = this.getComponent(Toggle).isChecked;
        if (isChecked != this.lastState) {
            this.lastState = isChecked;
            if (isChecked) no.EventHandlerInfo.execute(this.onChecked);
            else no.EventHandlerInfo.execute(this.onNotChecked);
        }
        return true;
    }
}
