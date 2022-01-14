
import { _decorator, PageView, Vec2, EventTouch, UITransform } from 'cc';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJPageView
 * DateTime = Fri Jan 14 2022 18:27:34 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJPageView.ts
 * FileBasenameNoExtension = YJPageView
 * URL = db://assets/Script/NoUi3/fix/YJPageView.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJPageView')
@menu('NoUi/fix/YJPageView(修正拖动问题)')
export class YJPageView extends PageView {
    @property({ displayName: '触发切换的偏移量' })
    offset: number = 30;

    private max: number;

    public a_onTouchDown(event: Event, start: Vec2, end: Vec2) {
        this.max = this.getPages().length;
    }

    public a_onTouchMove(event: EventTouch, start: Vec2, end: Vec2) {
        if (this.direction == PageView.Direction.Horizontal) {
            let x = this.content.position.x;
            x += event.getDeltaX();
            if (x > 0) x = 0;
            else if (x < this.node.getComponent(UITransform).width - this.content.getComponent(UITransform).width) x = this.node.getComponent(UITransform).width - this.content.getComponent(UITransform).width;
            this.content.setPosition(x, this.content.position.y);
        } else if (this.direction == PageView.Direction.Vertical) {
            let y = this.content.position.y;
            y += event.getDeltaY();
            if (y < 0) y = 0;
            else if (y > this.content.getComponent(UITransform).height - this.node.getComponent(UITransform).height) y = this.content.getComponent(UITransform).height - this.node.getComponent(UITransform).height;
            this.content.setPosition(this.content.position.x, y);
        }
    }

    public a_onTouchEnd(event: EventTouch, start: Vec2, end: Vec2) {
        let i = this.getCurrentPageIndex();
        if (this.direction == PageView.Direction.Horizontal) {
            if (end.x - start.x > this.offset) i--;
            else if (start.x - end.x > this.offset) i++;
            if (i < 0) i = 0;
        }
        else if (this.direction == PageView.Direction.Vertical) {
            if (end.y - start.y > this.offset) i++;
            else if (start.y - end.y > this.offset) i--;
            if (i < 0) i = 0;
        }

        else if (i >= this.max) i = this.max - 1;
        this.scrollToPage(i, 0.1);
    }

    public a_onTouchCancel(event: EventTouch, start: Vec2, end: Vec2) {
        this.a_onTouchEnd(event, start, end);
    }
}
