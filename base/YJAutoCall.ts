
import { _decorator, Component, Node } from 'cc';
import { no } from '../no';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJAutoCall
 * DateTime = Fri Jan 14 2022 17:51:46 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAutoCall.ts
 * FileBasenameNoExtension = YJAutoCall
 * URL = db://assets/Script/NoUi3/base/YJAutoCall.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJAutoCall')
@menu('NoUi/base/YJAutoCall(自动执行)')
export class YJAutoCall extends Component {
    @property({ displayName: '延时(ms)', min: 0, step: 1 })
    delay: number = 0;

    @property(no.EventHandlerInfo)
    calls: no.EventHandlerInfo[] = [];

    @property({ displayName: '加载时执行' })
    callOnLoad: boolean = false;

    @property({ displayName: '激活时执行' })
    callOnEnable: boolean = false;

    @property({ displayName: '仅执行一次' })
    once: boolean = false;

    private _done = false;
    onLoad() {
        this.callOnLoad && !this.callOnEnable && this.a_call();
    }

    onEnable() {
        this.unscheduleAllCallbacks();
        this.callOnEnable && this.a_call();
    }

    public a_call() {
        if (this.once && this._done) return;
        this._done = true;
        this.scheduleOnce(() => {
            no.EventHandlerInfo.execute(this.calls);
        }, this.delay / 1000);
    }
}
