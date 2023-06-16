
import { UITransform, v2, ccclass, menu } from '../yj';
import { SetScrollToPercent } from './SetScrollToPercent';

/**
 * Predefined variables
 * Name = SetScrollToNode
 * DateTime = Mon Jan 17 2022 14:16:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollToNode.ts
 * FileBasenameNoExtension = SetScrollToNode
 * URL = db://assets/Script/NoUi3/fuckui/SetScrollToNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScrollToNode')
@menu('NoUi/ui/SetScrollToNode(设置scrollView滚动到节点:string)')
export class SetScrollToNode extends SetScrollToPercent {

    protected onDataChange(data: any) {
        this.scheduleOnce(() => {
            this.a_scrollToNode(data);
        }, this.wait);
    }

    public a_scrollToNode(name: string) {
        if (!this.scrollView?.isValid) return;
        let node = this.scrollView.content.getChildByName(name);
        if (node == null) return;
        let ut = this.scrollView.content.getComponent(UITransform);
        let anchor = ut.anchorPoint;
        let size = ut.getBoundingBox().size;
        let pos = node.position;
        let offset = v2(pos.x + size.width * anchor.x + this.offset.x, pos.y - size.height * anchor.y - this.offset.y);
        if (!this.scrollView.vertical) {
            offset.y = 0;
        }
        if (!this.scrollView.horizontal) {
            offset.x = 0;
        }
        this.scrollToOffset(offset, this.duration);
    }
}
