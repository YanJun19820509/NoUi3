
import { math, UITransform, v2, _decorator, game } from './yj';
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
    @property({ tooltip: '受content节点缩放影响' })
    affectedByScale: boolean = false;

    private triedNum: number = 0;
    private scrollTime: number;
    private _target: YJNodeTarget;

    protected onDataChange(data: any) {
        this.triedNum = 0;
        this.a_scrollToTarget(data);
    }

    public a_scrollToTarget(targetType: string) {
        if (this.scrollView == null) return;
        if (this.wait > 0)
            this.scheduleOnce(() => {
                this.startScroll(targetType);
            }, this.wait);
        else this.startScroll(targetType);
    }

    private startScroll(targetType: string) {
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            if (this.triedNum < this.tryNum) {
                this.triedNum++;
                this.scheduleOnce(() => {
                    this.startScroll(targetType);
                });
                return;
            }
            console.error('找不到target：', targetType);
            return;
        }
        this.triedNum = 0;
        if (!this.affectedByScale)
            this.scrollToTarget(target);
        else this.scrollToTargetByFrame(target);
    }

    private scrollToTarget(target: YJNodeTarget) {
        this.scrollToOffset(this.getOffset(target), this.duration);
    }

    private scrollToTargetByFrame(target: YJNodeTarget) {
        this.scrollTime = this.duration;
        this._target = target;
        this.requestAnimationFrameScroll();
    }

    private getOffset(target: YJNodeTarget): math.Vec2 {
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
        if (offset.x < 0) offset.x = 0;
        if (offset.y < 0) offset.y = 0;
        return offset;
    }

    private scrollByFrame(dt: number) {
        if (!no.checkValid(this.node)) return;
        let curOffset = this.scrollView.getScrollOffset();
        let offset = this.getOffset(this._target);
        offset.x += curOffset.x;
        offset.y -= curOffset.y;
        offset.multiplyScalar(Math.min(dt / this.scrollTime, 1));
        offset.x -= curOffset.x;
        offset.y += curOffset.y;
        this.scrollToOffset(offset);
        this.scrollTime -= dt;
        if (this.scrollTime > 0) this.requestAnimationFrameScroll();
    }

    private requestAnimationFrameScroll() {
        requestAnimationFrame(() => {
            this.scrollByFrame(game.frameTime * .001);
        })
    }
}
