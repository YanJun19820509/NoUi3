
import { ccclass, property, menu, ScrollView, v2, Vec2, UITransform } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetScrollToPercent
 * DateTime = Mon Jan 17 2022 14:06:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollToPercent.ts
 * FileBasenameNoExtension = SetScrollToPercent
 * URL = db://assets/Script/NoUi3/fuckui/SetScrollToPercent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * data:number|{per:number, duration: number}
 */

@ccclass('SetScrollToPercent')
@menu('NoUi/ui/SetScrollToPercent(设置scrollView滚动到:number(0-1))')
export class SetScrollToPercent extends FuckUi {

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property
    offset: Vec2 = v2();

    @property({ displayName: '目标位置在可视范围内0-1', min: 0, max: 1 })
    at: number = 0.5;

    @property({ displayName: '滚动动画时长(秒)', min: 0 })
    duration: number = 0;

    @property({ displayName: '等待时长(秒)', min: 0 })
    wait: number = 0;

    protected onDataChange(data: any) {
        this.scheduleOnce(() => {
            if (typeof data == 'number')
                this.a_scrollToPercent(data);
            else this.a_scrollToPercent(data.per, data.duration);
        }, this.wait);
    }

    public a_scrollToPercent(per: number, duration?: number) {
        if (!this.scrollView?.isValid) return;
        let cs = this.scrollView.content.getComponent(UITransform).getBoundingBox().size;
        let ns = this.scrollView.node.getComponent(UITransform).getBoundingBox().size;

        let offset = v2(cs.width * per - ns.width * this.at + this.offset.x, cs.height * per - ns.height * this.at + this.offset.y);
        if (!this.scrollView.vertical) {
            offset.y = 0;
        }
        if (!this.scrollView.horizontal) {
            offset.x = 0;
        }
        this.scrollToOffset(offset, duration || this.duration);
    }

    protected scrollToOffset(offset: Vec2, duration = 0) {
        if (this.scrollView == null) return;
        let maxOffset = this.scrollView.getMaxScrollOffset();
        if (offset.x < 0) offset.x = 0;
        else if (offset.x > maxOffset.x) offset.x = maxOffset.x;
        if (offset.y < 0) offset.y = 0;
        else if (offset.y > maxOffset.y) offset.y = maxOffset.y;
        this.scrollView.scrollToOffset(offset, duration);
    }
}
