
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

    private _clickEvents: EventHandler[] = [];

    onLoad() {
        if (EDITOR) return;
        let btn = this.getComponent(Button);
        btn.clickEvents.forEach(e => {
            this._clickEvents[this._clickEvents.length] = e;
        });
        let a = new EventHandler();
        a.target = this.node;
        a.component = 'YJButton';
        a.handler = 'a_trigger';
        btn.clickEvents = [a];
    }

    public a_trigger(event: EventTouch) {
        if (event?.touch?.getID() != 0) return;
        no.Throttling.ins(this).wait(this.delay).then(a => {
            if (a)
                no.executeHandlers(this._clickEvents);
        })
    }
}