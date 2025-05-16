import { ccclass, requireComponent } from '../yj';
import { HackUi } from './HackUi';
import { SetSpriteFrameInSampler2D } from './SetSpriteFrameInSampler2D';

/**
 * 序列帧动画
 * Author mqsy_yj
 * DateTime Thu May 15 2025 10:21:52 GMT+0800 (中国标准时间)
 * data: {interval: number, frames: string[]}, interval为帧间隔,frames为帧序列图名
 */

@ccclass('SetFrameAniWithSample2D')
@requireComponent(SetSpriteFrameInSampler2D)
export class SetFrameAniWithSample2D extends HackUi {

    private _interval: number = 0.1;
    private _frames: string[] = [];
    private _curFrame: number = 0;
    private sprite: SetSpriteFrameInSampler2D = null;

    protected onDataChange(data: any) {
        if (!this.sprite) {
            this.sprite = this.getComponent(SetSpriteFrameInSampler2D);
        }
        const { interval, frames } = data;
        this._interval = interval;
        this._frames = frames;
        this._curFrame = 0;
        this.unschedule(this.updateFrame);
        this.schedule(this.updateFrame, this._interval);
    }

    private updateFrame() {
        if (this._curFrame >= this._frames.length) {
            this._curFrame = 0;
        }
        this.sprite.a_setData(this._frames[this._curFrame]);
        this._curFrame++;
    }
}
