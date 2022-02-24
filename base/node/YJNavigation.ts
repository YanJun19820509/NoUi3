
import { _decorator, Component, Node } from 'cc';
import { YJPanel } from './YJPanel';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJNavigation
 * DateTime = Thu Feb 24 2022 18:59:42 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNavigation.ts
 * FileBasenameNoExtension = YJNavigation
 * URL = db://assets/NoUi3/base/node/YJNavigation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJNavigation')
@menu('NoUi/node/YJCloseWindow(关闭窗口)')
export class YJNavigation extends Component {
    private static _ins: YJNavigation;

    private windowQueue = [];

    public static get ins(): YJNavigation {
        return this._ins;
    }

    onLoad() {
        YJNavigation._ins = this;
    }

    onDestroy() {
        YJNavigation._ins = null;
    }

    public add(comp: typeof YJPanel, to: string) {
        this.windowQueue[this.windowQueue.length] = [comp, to];
    }

    public getLast(): [typeof YJPanel, string] {
        return this.windowQueue.pop();
    }

    public clear() {
        this.windowQueue = [];
    }
}
