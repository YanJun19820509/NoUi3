
import { _decorator, Component, Node } from 'cc';
import { DEBUG } from 'cc/env';
const { ccclass, menu } = _decorator;

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
        !DEBUG && this.node.destroy();
    }
}
