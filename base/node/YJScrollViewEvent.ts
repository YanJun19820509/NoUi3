
/**
 * scrollview的scrollEvents扩展
 * Author mqsy_yj
 * DateTime Mon Aug 14 2023 12:13:53 GMT+0800 (中国标准时间)
 *
 */

import { Vec2 } from "cc";
import { no } from "../../no";
import { Component, EDITOR, ScrollView, ccclass, executeInEditMode, property, requireComponent } from "../../yj";

const eventTypeMap = {
    0: 'scroll-to-top',
    1: 'scroll-to-bottom',
    2: 'scroll-to-left',
    3: 'scroll-to-right',
    4: 'scrolling',
    6: 'bounce-bottom',
    7: 'bounce-left',
    8: 'bounce-right',
    5: 'bounce-top',
    9: 'scroll-ended',
    10: 'touch-up',
    11: 'scroll-ended-with-threshold',
    12: 'scroll-began'
};

@ccclass('YJScrollViewEvent')
@requireComponent(ScrollView)
@executeInEditMode()
export class YJScrollViewEvent extends Component {
    @property({ type: no.EventHandlerInfo })
    onScroll: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo })
    onToTop: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo })
    onToBottom: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo })
    onToLeft: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo })
    onToRight: no.EventHandlerInfo[] = [];

    private _maxOffset: Vec2;
    private _lastOffset: Vec2;

    onLoad() {
        if (EDITOR)
            this.getComponent(ScrollView).scrollEvents = [no.createClickEvent(this.node, 'YJScrollViewEvent', 'onScrollEvent')];
    }

    private onScrollEvent(sv: ScrollView, type: number) {
        if (!this._maxOffset) this._maxOffset = sv.getMaxScrollOffset();
        const et = eventTypeMap[type], offset = sv.getScrollOffset();
        no.EventHandlerInfo.execute(this.onScroll, et);

        if (!this._lastOffset) {
            this._lastOffset = offset;
            return;
        }
        if (et == ScrollView.EventType.SCROLL_ENDED) {
            if (offset.y == 0 && this._maxOffset.y != 0) no.EventHandlerInfo.execute(this.onToTop);
            else if (offset.y != 0 && offset.y == this._maxOffset.y) no.EventHandlerInfo.execute(this.onToBottom);
            if (offset.x == 0 && this._maxOffset.x != 0) no.EventHandlerInfo.execute(this.onToLeft);
            else if (offset.x != 0 && offset.x == this._maxOffset.x) no.EventHandlerInfo.execute(this.onToRight);
        }
        this._lastOffset = offset;
    }
}


