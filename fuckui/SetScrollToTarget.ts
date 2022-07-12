
import { UITransform, v2, _decorator } from 'cc';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { SetScrollToPercent } from './SetScrollToPercent';
const { ccclass, menu, property } = _decorator;

/**
 * Predefined variables
 * Name = SetScrollToTarget
 * DateTime = Mon Jan 17 2022 14:16:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollToTarget.ts
 * FileBasenameNoExtension = SetScrollToTarget
 * URL = db://assets/Script/NoUi3/fuckui/SetScrollToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScrollToTarget')
@menu('NoUi/ui/SetScrollToTarget(设置scrollView滚动到目标:string)')
export class SetScrollToTarget extends SetScrollToPercent {
    @property
    tryNum: number = 100;

    private triedNum: number = 0;

    protected onDataChange(data: any) {
        this.triedNum = 0;
        this.scheduleOnce(() => {
            this.a_scrollToTarget(data);
        }, this.wait);
    }

    public a_scrollToTarget(targetType: string) {
        if (this.scrollView == null) return;
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            if (this.triedNum < this.tryNum) {
                this.triedNum++;
                this.scheduleOnce(() => {
                    this.a_scrollToTarget(targetType);
                });
                return;
            }
            console.error('找不到target：', targetType);
            return;
        }
        let pos = target.nodeWorldPosition;
        let ut = this.scrollView.content.getComponent(UITransform);
        let anchor = ut.anchorPoint;
        let size = ut.getBoundingBox().size;
        ut.convertToNodeSpaceAR(pos, pos);
        pos.x += size.width * anchor.x;
        pos.y += size.height * (anchor.y - 1);
        let svSize = this.scrollView.node.getComponent(UITransform).contentSize;
        let offset = v2(pos.x - svSize.width * this.at, - pos.y - svSize.height * this.at);
        if (!this.scrollView.vertical) {
            offset.y = 0;
        }
        if (!this.scrollView.horizontal) {
            offset.x = 0;
        }
        this.scrollToOffset(offset);
    }
}
