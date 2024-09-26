import { no } from "NoUi3/no";
import { ccclass, Component, macro, property } from "../../yj";
/**
 * 设备方向
 * Author mqsy_yj
 * DateTime Thu Sep 26 2024 14:27:23 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJDeviceOrientaton')
export class YJDeviceOrientaton extends Component {
    @property({ displayName: '是否一直监听' })
    always: boolean = false;
    @property({ type: no.EventHandlerInfo, displayName: '横屏时' })
    onLandscape: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '竖屏时' })
    onPortrait: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '切换时' })
    onChange: no.EventHandlerInfo[] = [];

    private _lastOrientaton: number = -1;

    onLoad() {
        this.updateCheck();
        if (this.always)
            this.schedule(this.updateCheck, .1, macro.REPEAT_FOREVER);
    }

    private check() {
        if (this._lastOrientaton == 0) {
            no.EventHandlerInfo.execute(this.onLandscape);
        } else no.EventHandlerInfo.execute(this.onPortrait);
    }

    private updateCheck() {
        const v = no.deviceOrientation();
        if (this._lastOrientaton != v) {
            this._lastOrientaton = v;
            this.check();
            no.EventHandlerInfo.execute(this.onChange);
        }
    }
}