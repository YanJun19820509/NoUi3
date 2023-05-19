
import { _decorator, Component, Node, ScrollView } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJResetScrollView
 * DateTime = Sat May 07 2022 16:25:24 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJResetScrollView.ts
 * FileBasenameNoExtension = YJResetScrollView
 * URL = db://assets/NoUi3/base/node/YJResetScrollView.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJResetScrollView')
@requireComponent(ScrollView)
export class YJResetScrollView extends Component {
    @property({ tooltip: 'topLeft滚动到顶部或左边，否则滚动到底部或右边，根据滚动的方向来判断' })
    topLeft: boolean = true;
    @property({ min: 0, step: 0.1, displayName: '动效时长(s)' })
    duration: number = 0.1;

    onEnable() {
        this.scheduleOnce(this.a_reset);
    }

    public a_reset(): void {
        let sv = this.getComponent(ScrollView);
        if (!sv) return;
        if (sv.horizontal) sv.scrollToPercentHorizontal(this.topLeft ? 0 : 1, this.duration, true);
        if (sv.vertical) sv.scrollToPercentVertical(this.topLeft ? 1 : 0, this.duration, true);
    }
}
