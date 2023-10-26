import { no } from "../../no";
import { Component, EDITOR, ccclass, property, Node } from "../../yj";

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
export class YJSliderButton extends Component {
    @property
    interactable: boolean = true;
    @property({ type: Node })
    slider: Node = null;
    @property({ type: Node })
    checkedShowNodes: Node[] = [];
    @property({ type: Node })
    checkedHideNodes: Node[] = [];
    @property
    public get checked(): boolean {
        return this._checked;
    }

    public set checked(v: boolean) {
        if (this._checked == v) return;
        this._checked = v;
        if (this.slider) {
            this.moveSlider();
        }
    }
    @property({ displayName: '防连点间隔时长(s)' })
    delay: number = 1;
    @property({ type: no.EventHandlerInfo })
    onChange: no.EventHandlerInfo[] = [];

    @property({ serializable: true })
    private _checked: boolean = false;
    private _done: boolean = true;
    private needWait: boolean = false;
    private _first: boolean = true;

    protected onLoad(): void {
        this.setCheckedNodesVisible();
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    onEnable() {
        this.needWait = false;
    }

    protected onDestroy(): void {
        this.node.targetOff(this);
    }

    private onClick() {
        this._first = false;
        if (!this.interactable || !this.enabled) return;
        if (!this._done) return;
        if (this.needWait) return;
        this.needWait = true;
        this._done = false;
        this._checked = !this._checked;
        if (this.slider) {
            this.moveSlider();
        } else {
            this.setCheckedNodesVisible();
            no.EventHandlerInfo.execute(this.onChange, this._checked);
            this._done = true;
        }

        this.scheduleOnce(() => {
            this.needWait = false;
        }, this.delay);
    }

    private moveSlider(noChange = false) {
        let x = Math.abs(no.x(this.slider));
        x *= this._checked ? 1 : -1;
        this.playAni(x, noChange);
    }

    private playAni(x: number, noChange: boolean) {
        if (EDITOR || this._first) {
            this._first = false;
            no.x(this.slider, x);
            this.setCheckedNodesVisible();
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
            this.setCheckedNodesVisible();
            if (!noChange)
                no.EventHandlerInfo.execute(this.onChange, this._checked);
        });
    }

    private setCheckedNodesVisible() {
        this.checkedShowNodes.forEach(n => {
            no.visible(n, this._checked);
        });
        this.checkedHideNodes.forEach(n => {
            no.visible(n, !this._checked);
        });
        this._done = true;
    }

    /**
     * 设置开关状态,会触发状态改变回调
     */
    public set isChecked(v: boolean) {
        this.checked = v;
    }

    public set isCheckedNoChange(v: boolean) {
        this._checked = v;
        this.moveSlider(true);
    }
}
