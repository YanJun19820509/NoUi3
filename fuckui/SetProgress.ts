
import { ProgressBar, _decorator } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

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

@ccclass('SetProgress')
@menu('NoUi/ui/SetProgress(设置进度条:number)')
export class SetProgress extends FuckUi {

    @property(ProgressBar)
    progressBar: ProgressBar = null;
    @property({ displayName: '缓动速度', step: 50, min: 0, tooltip: '从0到1所需要毫秒时间' })
    motionSpeed: number = 500;
    @property({ displayName: '小最进度', min: 0, max: 1, step: 0.1 })
    initValue: number = 0;

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
            this.targetValue = -1;
        }
    }

    protected onDataChange(data: any) {
        this.progressBar.progress = 0;
        this.targetValue = -1;
        if (data > 0 && data < this.initValue)
            data = this.initValue;
        if (this.motionSpeed == 0 || this.isFirst || data <= this.lastValue) {
            this.progressBar.progress = data;
            this.isFirst = false;
        } else {
            this.targetValue = data;
            this.dir = data > this.progressBar.progress ? 1 : -1;
        }
        this.lastValue = data;
    }

    private setProgressByFrame(dt: number) {
        if (this.targetValue >= 0) {
            let p = this.progressBar.progress + this.speed * this.dir * dt;
            if (this.dir > 0 && p >= this.targetValue || this.dir < 0 && p <= this.targetValue) {
                p = this.targetValue;
                this.targetValue = -1;
            }
            this.progressBar.progress = p;
        }
    }

    update(dt: number): void {
        this.setProgressByFrame(dt);
    }
}
