
import { no } from '../../../NoUi3/no';
import { Component, ccclass, sys } from '../../../NoUi3/yj';

@ccclass('OpenGM')
export class OpenGM extends Component {
    clickNum: number = 0;
    lastClickT: number = 0;
    public a_switchDebug() {
        if (no.isDebug()) {
            let currentTime = no.timestampMs();
            this.clickNum = (currentTime - this.lastClickT) < 200 ? this.clickNum + 1 : 1;
            this.lastClickT = no.timestampMs();

            if (this.clickNum > 3) {
                window['show_GM_btn'] = !window['show_GM_btn']
                no.evn.emit('show_GM_btn')
                if (sys.platform == sys.Platform.WECHAT_GAME) {
                    window['wx'].setEnableDebug({
                        enableDebug: window['show_GM_btn']
                    });
                }
            }
        }
    }
}


