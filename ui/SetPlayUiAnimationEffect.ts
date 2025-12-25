import { ccclass, property, requireComponent } from '../yj';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import { HackUi } from './HackUi';

/**
 * 设置YJUIAnimationEffect的播放/停止
 * Author mqsy_yj
 * DateTime Wed Mar 12 2025 10:24:15 GMT+0800 (中国标准时间)
 * data: boolean|string, 如果为true则播放，如果为false则停止，如果为string则播放指定type的动画
 */

@ccclass('SetPlayUiAnimationEffect')
@requireComponent(YJUIAnimationEffect)
export class SetPlayUiAnimationEffect extends HackUi {
    @property({ displayName: '播放所有动画' })
    playAll: boolean = false;

    protected onDataChange(data: any) {
        const comp = this.getComponent(YJUIAnimationEffect);
        if (this.playAll) {
            if (data === true) {
                comp?.a_playAll();
            } else if (data === false) {
                comp?.a_stop();
            }
        } else {
            if (typeof data === 'boolean') {
                comp?.a_playOrStop(data);
            } else if (typeof data === 'string') {
                comp?.a_play(null, data);
            }
        }
    }
}
