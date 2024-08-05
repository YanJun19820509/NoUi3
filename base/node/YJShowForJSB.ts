
import { _decorator, Component, Node, sys } from 'cc';
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
    @property({ displayName: '支持Apple' })
    ios: boolean = true;
    @property({ displayName: '支持Android' })
    android: boolean = true;

    onLoad() {
        if (!this.enabled) return;
        let a = true;
        if (!JSB) a = false;
        else if (sys.platform == sys.Platform.IOS && !this.ios) a = false;
        else if (sys.platform == sys.Platform.ANDROID && !this.android) a = false;
        !a && this.node.destroy();
    }
}
