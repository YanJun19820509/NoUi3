
import { ProgressBar, ccclass, property, menu, Label } from '../yj';
import { FuckUi } from './FuckUi';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';

/**
 * Predefined variables
 * Name = SetProgress
 * DateTime = Mon Jan 17 2022 12:12:56 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetProgress.ts
 * FileBasenameNoExtension = SetProgress
 * URL = db://assets/Script/NoUi3/fuckui/SetProgress.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
//data number|[cur, max]
@ccclass('SetProgress')
@menu('NoUi/ui/SetProgress(设置进度条:number)')
export class SetProgress extends FuckUi {

    @property(ProgressBar)
    progressBar: ProgressBar = null;
    @property({ displayName: '缓动速度', step: 50, min: 0, tooltip: '从0到1所需要毫秒时间' })
    motionSpeed: number = 500;
    @property({ displayName: '小最进度', min: 0, max: 1, step: 0.1 })
    initValue: number = 0;
    @property({ type: Label })
    label: Label = null;
    @property({ type: YJCharLabel })
    charLabel: YJCharLabel = null;

    private speed: number;
    private dir: number;
    private targetValue: number = -1;
    private isFirst: boolean = true;
    private lastValue: number = 0;

    onLoad() {
        super.onLoad();
        this.speed = 1000 / this.motionSpeed;
    }

    onDisable() {
        this.isFirst = true;
        if (this.targetValue >= 0) {
            this.progressBar.progress = this.targetValue;
        }
    }

    protected onDataChange(data: any) {
        this.setLabel(data);
        if (data instanceof Array) data = data[0] / data[1];
        if (data > 0 && data < this.initValue)
            data = this.initValue;
        this.targetValue = data;
        if (this.motionSpeed == 0 || this.isFirst || data <= this.lastValue) {
            this.progressBar.progress = data;
            this.isFirst = false;
        } else {
            this.dir = data > this.progressBar.progress ? 1 : -1;
            no.scheduleForever(this.setProgressByFrame, 0, this);
        }
        this.lastValue = data;
    }

    private setProgressByFrame(dt: number) {
        if (this.targetValue >= 0) {
            let p = this.progressBar.progress + this.speed * this.dir * dt;
            if (this.dir > 0 && p >= this.targetValue || this.dir < 0 && p <= this.targetValue) {
                p = this.targetValue;
                no.unschedule(this, this.setProgressByFrame);
            }
            this.progressBar.progress = p;
        }
    }

    private setLabel(data: any) {
        if (!this.label && !this.charLabel) return;
        let s: string
        if (typeof data == 'number') {
            s = Math.floor(data * 1000) / 10 + '%';
        } else if (data instanceof Array) {
            s = `${data[0]}/${data[1]}`;
        }
        if (this.label)
            this.label.string = s;
        else if (this.charLabel)
            this.charLabel.string = s;
    }
}
