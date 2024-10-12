
import { ccclass, property, requireComponent, UITransform, Vec3, math, Vec2, Enum } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetNodeTweenAction } from './SetNodeTweenAction';
import { EasingType, EasingTypeName } from 'NoUi3/types';

/**
 * Predefined variables
 * Name = SetMoveTweenToNodeTarget
 * DateTime = Wed Jun 29 2022 18:05:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetMoveTweenToNodeTarget.ts
 * FileBasenameNoExtension = SetMoveTweenToNodeTarget
 * URL = db://assets/NoUi3/fuckui/SetMoveTweenToNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 将当前节点移动到指定节点位置
 */

@ccclass('SetMoveTweenToNodeTarget')
@requireComponent(SetNodeTweenAction)
export class SetMoveTweenToNodeTarget extends FuckUi {

    @property({ displayName: '根据速度计算时间' })
    fixSpeed: boolean = true;

    @property({ min: 1, displayName: '移动速度', tooltip: '移动速度', visible() { return this.fixSpeed; } })
    speed: number = 10;

    @property({ min: 0.01, displayName: '移动时间(s)', visible() { return !this.fixSpeed; } })
    time: number = 1;

    @property
    offset: Vec2 = math.v2();
    @property({ type: Enum(EasingType) })
    easing: EasingType = EasingType.LINEAR;

    protected onDataChange(data: any) {
        this.setTween(data);
    }

    protected setTween(targetType: string) {
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            this.scheduleOnce(() => {
                this.setTween(targetType);
            });
            return;
        }

        let pos = target.nodeWorldPosition;
        this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        let p = this.node.position;
        let dis = Vec3.distance(p, pos);
        let duration = this.fixSpeed ? dis / this.speed : this.time;
        this.getComponent(SetNodeTweenAction).setData({
            duration: duration,
            to: 1,
            props: {
                pos: [pos.x + this.offset.x, pos.y + this.offset.y]
            },
            easing: EasingTypeName[this.easing]
        });
    }
}
