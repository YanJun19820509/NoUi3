
import { _decorator, Button, Component, Node, Toggle } from 'cc';
import { no } from '../../no';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJSliderButton
 * DateTime = Fri Jul 14 2023 16:41:49 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSliderButton.ts
 * FileBasenameNoExtension = YJSliderButton
 * URL = db://assets/NoUi3/widget/sliderButton/YJSliderButton.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 滑块按钮
 */

@ccclass('YJSliderButton')
@executeInEditMode()
export class YJSliderButton extends Component {
    @property
    interactable: boolean = true;
    @property({ type: Node })
    slider: Node = null;
    @property
    checked: boolean = false;
    @property({ displayName: '防连点间隔时长(s)' })
    delay: number = 1;
    @property({ type: no.EventHandlerInfo })
    onChange: no.EventHandlerInfo[] = [];

    private _checked: boolean = false;
    private _done: boolean = true;
    private needWait: boolean = false;

    protected onLoad(): void {
        if (EDITOR) return;
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    onEnable() {
        this.needWait = false;
    }

    protected onDestroy(): void {
        this.node.targetOff(this);
    }

    private onClick() {
        if (!this.interactable || !this.enabled) return;
        if (!this._done) return;
        if (this.needWait) return;
        this.needWait = true;
        this._done = false;
        this.checked = !this.checked;
        if (this.slider) {
            this.moveSlider();
        } else {
            no.EventHandlerInfo.execute(this.onChange, this.checked);
            this._done = true;
        }

        this.scheduleOnce(() => {
            this.needWait = false;
        }, this.delay);
    }

    private moveSlider() {
        let x = Math.abs(no.x(this.slider));
        x *= this.checked ? 1 : -1;
        this.playAni(x);
    }

    private playAni(x: number) {
        if (EDITOR) {
            no.x(this.slider, x);
            return;
        }
        const action = no.parseTweenData({
            duration: 0.1,
            to: 1,
            props: {
                pos: [x, no.y(this.slider)]
            }
        }, this.slider);
        no.TweenSet.play(action, () => {
            no.EventHandlerInfo.execute(this.onChange, this.checked);
            this._done = true;
        });
    }

    protected update(dt: number): void {
        if (EDITOR) {
            if (this.checked != this._checked) {
                this._checked = this.checked;
                this.moveSlider();
            }
        }
    }

    public set isChecked(v: boolean) {
        this.checked = v;
        this.moveSlider();
    }
}
