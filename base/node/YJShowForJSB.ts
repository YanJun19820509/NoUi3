
import { _decorator, Component, Node } from './yj';
import { JSB } from 'cc/env';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJShowForJSB
 * DateTime = Wed Aug 17 2022 18:33:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForJSB.ts
 * FileBasenameNoExtension = YJShowForJSB
 * URL = db://assets/NoUi3/base/node/YJShowForJSB.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJShowForJSB')
export class YJShowForJSB extends Component {
    onLoad() {
        if (!this.enabled) return;
        !JSB && this.node.destroy();
    }
}
