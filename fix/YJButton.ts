
import { EDITOR, ccclass, property, menu, requireComponent, Component, Node, Button, EventHandler, EventTouch, disallowMultiple } from '../yj';
import { no } from '../no';

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
@disallowMultiple()
export class YJButton extends Component {
    @property({ displayName: '防连点间隔时长(s)' })
    delay: number = 1;
    @property({ displayName: '延时生效(s)', min: 0 })
    wait: number = 0;

    private _canClick = true;

    private _clickEvents: EventHandler[] = [];
    private needWait: boolean = false;

    onEnable() {
        this.needWait = false;
        let btn = this.getComponent(Button);
        btn.clickEvents.forEach(e => {
            this._clickEvents[this._clickEvents.length] = e;
        });
        btn.clickEvents.length = 0;
        this.scheduleOnce(() => {
            btn.clickEvents = [no.createClickEvent(this.node, 'YJButton', 'a_trigger')];
        }, this.wait);
    }

    public addClickHandler(handler: EventHandler) {
        this._clickEvents[this._clickEvents.length] = handler;
    }

    public a_trigger(event: EventTouch) {
        if (!this._canClick && event) return;
        if (event && event.getAllTouches().length > 1) return;
        if (this.needWait) return;
        this.needWait = true;
        no.executeHandlers(this._clickEvents, event);
        this.scheduleOnce(() => {
            this.needWait = false;
        }, this.delay);
    }

    public set canClick(v: boolean) {
        this._canClick = v;
    }
}