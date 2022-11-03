
import { _decorator, Component, Node, EventTouch } from 'cc';
import { YJWindowManager } from './YJWindowManager';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJOpenWindow
 * DateTime = Thu Feb 24 2022 17:29:23 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJOpenWindow.ts
 * FileBasenameNoExtension = YJOpenWindow
 * URL = db://assets/NoUi3/base/node/YJOpenWindow.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('OpenWindowInfo')
export class OpenWindowInfo {
    @property
    windowName: string = '';
    @property
    to: string = '';

    public open() {
        YJWindowManager.createPanel(this.windowName, this.to);
    }
}

@ccclass('YJOpenWindow')
@menu('NoUi/node/YJOpenWindow(打开窗口)')
export class YJOpenWindow extends Component {
    @property(OpenWindowInfo)
    infos: OpenWindowInfo[] = [];

    @property
    autoOpen: boolean = false;

    onLoad() {
        this.autoOpen && this.a_open();
    }

    public a_open() {
        let n = this.infos.length, i = 0;
        this.schedule(() => {
            this.openAt(i++);
        }, 0, n - 1);
    }

    public a_openAt(event: EventTouch, idx: string): void {
        this.openAt(Number(idx || event));
    }

    private openAt(i: number) {
        let info = this.infos[i];
        info?.open();
    }
}
