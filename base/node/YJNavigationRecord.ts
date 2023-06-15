
import { _decorator, Component, Node, js } from './yj';
import { YJNavigation } from './YJNavigation';
import { YJPanel } from './YJPanel';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJNavigationRecord
 * DateTime = Thu Feb 24 2022 20:17:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNavigationRecord.ts
 * FileBasenameNoExtension = YJNavigationRecord
 * URL = db://assets/NoUi3/base/node/YJNavigationRecord.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJNavigationRecord')
@menu('NoUi/node/YJNavigationRecord(导航记录当前窗口)')
export class YJNavigationRecord extends Component {

    @property
    windowName: string = '';

    public a_record() {
        if (this.windowName == '') return;
        YJNavigation.ins?.add(js.getClassByName(this.windowName) as typeof YJPanel, this.node.parent.name);
    }
}
