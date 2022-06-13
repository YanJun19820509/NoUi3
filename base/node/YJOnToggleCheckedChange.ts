
import { _decorator, Component, Node, Toggle } from 'cc';
import { no } from '../../no';
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

    update() {
        let isChecked = this.getComponent(Toggle).isChecked;
        if (isChecked == this.lastState) return;
        this.lastState = isChecked;
        if (isChecked) no.EventHandlerInfo.execute(this.onChecked);
        else no.EventHandlerInfo.execute(this.onNotChecked);
    }
}
