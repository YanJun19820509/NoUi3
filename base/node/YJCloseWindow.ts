
import { ccclass, property, menu, Component, Node } from '../../yj';
import { YJWindowManager } from './YJWindowManager';

/**
 * Predefined variables
 * Name = YJCloseWindow
 * DateTime = Thu Feb 24 2022 17:29:34 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCloseWindow.ts
 * FileBasenameNoExtension = YJCloseWindow
 * URL = db://assets/NoUi3/base/node/YJCloseWindow.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJCloseWindow')
@menu('NoUi/node/YJCloseWindow(关闭窗口)')
export class YJCloseWindow extends Component {
    @property
    windowName: string = '';
    @property
    autoClose: boolean = false;

    onLoad() {
        this.autoClose && this.a_close();
    }

    public a_close() {
        if (this.windowName == '') return;
        YJWindowManager.closePanel(this.windowName);
    }
}
