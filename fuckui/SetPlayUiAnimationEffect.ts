import { ccclass, property, requireComponent } from 'NoUi3/yj';
import { FuckUi } from './FuckUi';
import { YJUIAnimationEffect } from 'NoUi3/base/ani/YJUIAnimationEffect';

/**
 * 设置YJUIAnimationEffect的播放/停止
 * Author mqsy_yj
 * DateTime Wed Mar 12 2025 10:24:15 GMT+0800 (中国标准时间)
 * data: boolean, 如果为true则播放，如果为false则停止，如果非boolean则忽略
 */

@ccclass('SetPlayUiAnimationEffect')
@requireComponent(YJUIAnimationEffect)
export class SetPlayUiAnimationEffect extends FuckUi {

    protected onDataChange(data: any) {
        if (typeof data === 'boolean') {
            this.getComponent(YJUIAnimationEffect)?.a_playOrStop(data);
        }
    }
}
