
import { ccclass, menu, Component, Node } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJShowForDebug
 * DateTime = Fri Jan 14 2022 16:35:09 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForDebug.ts
 * FileBasenameNoExtension = YJShowForDebug
 * URL = db://assets/Script/NoUi3/base/node/YJShowForDebug.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJShowForDebug')
@menu('NoUi/node/YJShowForDebug(debug模式下显示)')
export class YJShowForDebug extends Component {
    onLoad() {
        if (!this.enabled) return;
        this.node.active = window['show_GM_btn'];
        no.evn.on('show_GM_btn', () => {
            if (this?.node?.isValid)
                this.node.active = window['show_GM_btn'];
        }, this);
    }
    onDestroy() {
        no.evn.targetOff(this);
    }
}
