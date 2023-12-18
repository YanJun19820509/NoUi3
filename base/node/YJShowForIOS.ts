
import { ccclass, Component, property, sys } from '../../yj';

/**
 * Predefined variables
 * Name = YJShowForIOS
 * DateTime = Wed Aug 17 2022 18:33:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowForIOS.ts
 * FileBasenameNoExtension = YJShowForIOS
 * URL = db://assets/NoUi3/base/node/YJShowForIOS.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJShowForIOS')
export class YJShowForIOS extends Component {
    @property({ displayName: '取反' })
    reverse: boolean = false;
    onLoad() {
        if (!this.enabled) return;
        if (sys.os == sys.OS.IOS && this.reverse) this.node.destroy();
        else if (sys.os != sys.OS.IOS && !this.reverse) this.node.destroy();
    }
}
