import { ccclass, property, requireComponent, Sprite, tween } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetSpriteFillRange
 * DateTime = Mon Jun 27 2022 11:46:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFillRange.ts
 * FileBasenameNoExtension = SetSpriteFillRange
 * URL = db://assets/NoUi3/fuckui/SetSpriteFillRange.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSpriteFillRange')
@requireComponent(Sprite)
export class SetSpriteFillRange extends FuckUi {
    @property({
        tooltip: "缓动时间(秒)",
        min: 0 // 添加最小值限制
    })
    private duration: number = 0;

    private sprite: Sprite = null;
    private currentTween: any = null;

    public onLoad() {
        super.onLoad && super.onLoad();
        // 缓存 Sprite 组件引用
        this.sprite = this.getComponent(Sprite);
    }

    protected onDataChange(data: any) {
        if (!this.sprite) return;
        // 添加 isNaN 检查
        if (isNaN(data)) return;
        const targetValue = Math.max(0, Math.min(Number(data), 1));

        // 如果有正在进行的缓动，先停止它
        if (this.currentTween) {
            this.currentTween.stop();
        }

        // 创建新的缓动
        this.currentTween = tween(this.sprite)
            .to(this.duration, { fillRange: targetValue }, {
                easing: 'linear'
            })
            .start();
    }

    protected onDestroy() {
        super.onDestroy && super.onDestroy();
        // 组件销毁时停止缓动
        if (this.currentTween) {
            this.currentTween.stop();
            this.currentTween = null;
        }
    }
}
