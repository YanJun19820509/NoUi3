
import { EDITOR, ccclass, property, menu, Node, EventHandler, Slider } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetSliderProgress
 * DateTime = Mon Jan 17 2022 14:30:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSliderProgress.ts
 * FileBasenameNoExtension = SetSliderProgress
 * URL = db://assets/Script/NoUi3/fuckui/SetSliderProgress.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetSliderProgress')
@menu('NoUi/ui/SetSliderProgress(设置滑块进度:number(0-1))')
export class SetSliderProgress extends FuckUi {

    @property(no.EventHandlerInfo)
    onProgressChange: no.EventHandlerInfo[] = [];
    @property(no.EventHandlerInfo)
    onProgressChangeEnd: no.EventHandlerInfo[] = [];

    onLoad() {
        super.onLoad();
        if (EDITOR) return;
        let e = new EventHandler();
        e.target = this.node;
        e.component = 'SetSlider';
        e.handler = 'onSliderEvent';
        this.getComponent(Slider).slideEvents.push(e);
        this.node.on(Node.EventType.TOUCH_END, this.onEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onEnd, this);
    }

    protected onDataChange(data: any) {
        if (this.getComponent(Slider) == null) return;
        this.getComponent(Slider).progress = Number(data);
    }

    private onSliderEvent(slider: Slider) {
        no.EventHandlerInfo.execute(this.onProgressChange, slider.progress);
    }

    private onEnd() {
        no.EventHandlerInfo.execute(this.onProgressChangeEnd);
    }
}
