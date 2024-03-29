
import { _decorator, Component, Node, Button, EventHandler, EventTouch } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
const { ccclass, property, menu, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJButton
 * DateTime = Fri Jan 14 2022 18:25:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJButton.ts
 * FileBasenameNoExtension = YJButton
 * URL = db://assets/Script/NoUi3/fix/YJButton.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJButton')
@menu('NoUi/fix/YJButton(防连点及trigger)')
@requireComponent(Button)
export class YJButton extends Component {
    @property({ displayName: '防连点间隔时长(s)' })
    delay: number = 1;
    @property({ displayName: '延时生效(s)', min: 0 })
    wait: number = 0;

    private _clickEvents: EventHandler[] = [];
    private needWait: boolean = false;

    onLoad() {
        if (EDITOR || !this.enabled) return;
        let btn = this.getComponent(Button);
        btn.clickEvents.forEach(e => {
            this._clickEvents[this._clickEvents.length] = e;
        });
        btn.clickEvents.length = 0;
        this.scheduleOnce(() => {
            btn.clickEvents = [no.createClickEvent(this.node, 'YJButton', 'a_trigger')];
        }, this.wait);
    }

    onEnable() {
        this.needWait = false;
    }

    public addClickHandler(handler: EventHandler) {
        this._clickEvents[this._clickEvents.length] = handler;
    }

    public a_trigger(event: EventTouch) {
        if (event && event.getAllTouches().length > 1) {
            return;
        }
        if (this.needWait) return;
        this.needWait = true;
        no.executeHandlers(this._clickEvents, event);
        this.scheduleOnce(() => {
            this.needWait = false;
        }, this.delay);
    }

}