
import { UITransform, _decorator } from 'cc';
import { SetScrollToPercent } from './SetScrollToPercent';
const { ccclass, menu } = _decorator;

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
        if (this.scrollView == null) return;
        let node = this.scrollView.content.getChildByName(name);
        if (node == null) return;
        let size = this.scrollView.content.getComponent(UITransform).getBoundingBox().size;
        let rect = node.getComponent(UITransform).getBoundingBox();
        let percent = 0;
        if (this.scrollView.vertical) {
            percent = -rect.origin.y / size.height;
        } else {
            percent = rect.origin.x / size.width;
        }
        this.a_scrollToPercent(percent);
    }
}
