
import { EDITOR, ccclass, property, menu, executeInEditMode, Label, isValid } from '../yj';
import { YJTimeFormatDecorator } from '../base/YJTimeFormatDecorator';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetTimeCountDown
 * DateTime = Mon Jan 17 2022 14:39:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTimeCountDown.ts
 * FileBasenameNoExtension = SetTimeCountDown
 * URL = db://assets/Script/NoUi3/fuckui/SetTimeCountDown.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
 * 设置倒计时
 * data: 时间段 秒
 */
@ccclass('SetTimeCountDown')
@menu('NoUi/ui/SetTimeCountDown(设置倒计时:number)')
@executeInEditMode()
export class SetTimeCountDown extends FuckUi {

    @property({ displayName: '显示倒计时' })
    isLabel: boolean = true;
    @property({ type: Label, visible() { return this.isLabel; } })
    label: Label = null;
    @property({ type: YJCharLabel, visible() { return this.isLabel; } })
    charLabel: YJCharLabel = null;
    @property({ displayName: '格式化模板', visible() { return this.isLabel; } })
    formatter: string = '{h}:{m}:{s}';
    @property({ displayName: '用0补位', visible() { return this.isLabel; } })
    show0: boolean = true;
    @property({ type: YJTimeFormatDecorator, displayName: '格式化装饰器', visible() { return this.isLabel; } })
    decorator: YJTimeFormatDecorator = null;

    @property({ type: FuckUi, tooltip: '将倒计时转换成百分比，传给对应组件' })
    fuckUiComponents: FuckUi[] = [];
    @property({ displayName: '由0到1', visible() { return !this.isLabel; } })
    is0_1: boolean = true;

    @property({ type: no.EventHandlerInfo, displayName: '每秒回调' })
    secondCalls: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '结束回调' })
    endCalls: no.EventHandlerInfo[] = [];

    @property({ displayName: '定时触发' })
    isTime: boolean = false;
    @property({ min: 0, step: 1, displayName: '定时触发时间', visible() { return this.isTime; } })
    time: number = 60;
    @property({ type: no.EventHandlerInfo, displayName: '定时回调', visible() { return this.isTime; } })
    timeCalls: no.EventHandlerInfo[] = [];

    private _max: number;
    private _deadline: number;

    onLoad() {
        super.onLoad();
        if (this.getComponent(YJDynamicTexture)) this.getComponent(YJDynamicTexture).needClear = true;


        if (EDITOR) {
            if (this.charLabel) {
                this.charLabel.packToAtlas = false;
            }
        }
    }

    onDisable() {
        no.sysTime.offTickTock(this);
    }

    protected onDataChange(data: any) {
        no.sysTime.offTickTock(this);
        if (typeof data == 'string' && isNaN(Number(data))) {
            this.setLabel(data);
            return;
        }
        let now = no.sysTime.now;
        if (data instanceof Array) {
            let a = Number(data[0]);
            if (a <= 0) {
                this.setLabel('');
                return;
            }
            this._deadline = a + now;
            this._max = Number(data[1]);
        } else {
            let a = Number(data);
            if (a <= 0) {
                this.setLabel('');
                return;
            }
            this._deadline = a + now;
            this._max = a;
        }
        this.doTickTock(now);
        no.sysTime.onTickTock(this);
    }

    public doTickTock(now: number) {
        if (!isValid(this.node, true)) return;
        let a = this._deadline - now;
        if (a <= 0) {
            no.sysTime.offTickTock(this);
            no.EventHandlerInfo.execute(this.endCalls);
            return;
        } else {
            no.EventHandlerInfo.execute(this.secondCalls);
            if (this.isTime && a == this.time) {
                no.EventHandlerInfo.execute(this.timeCalls);
            }
        }
        if (this.isLabel) {
            if (this.decorator) this.setLabel(this.decorator.format(a));
            else
                this.setLabel(no.sec2time(a, this.formatter, this.show0));
        }
        this.setPercent(a);
    }

    private setLabel(str: string): void {
        if (this.label) {
            this.label.string = str || '';
        } else if (this.charLabel) this.charLabel.string = str || '';
    }

    private setPercent(v: number) {
        v /= this._max;
        if (this.is0_1) v = 1 - v;
        this.fuckUiComponents.forEach(ui => {
            ui.setData(String(v));
        });
    }

    /////////////EDITOR////////////
    update() {
        if (!EDITOR) return;
        let a = !this.node.getComponent('YJBitmapFont');
        if (a && this.label && !this.getComponent(YJDynamicTexture)) this.addComponent(YJDynamicTexture);
        else if (!this.label && this.getComponent(YJDynamicTexture)) this.getComponent(YJDynamicTexture).destroy();
    }
}
