
import { _decorator, Component, Node } from 'cc';
import { YJNavigation } from './YJNavigation';
import { YJWindowManager } from './YJWindowManager';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJNavigationBack
 * DateTime = Thu Feb 24 2022 20:17:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNavigationBack.ts
 * FileBasenameNoExtension = YJNavigationBack
 * URL = db://assets/NoUi3/base/node/YJNavigationBack.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJNavigationBack')
@menu('NoUi/node/YJNavigationBack(导航返回上一次窗口)')
export class YJNavigationBack extends Component {
    public a_back() {
        let [comp, to] = YJNavigation.ins.getLast();
        YJWindowManager.createPanel(comp, to);
    }
}
