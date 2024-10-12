import { YJNodeTarget } from 'NoUi3/base/node/YJNodeTarget';
import { no } from 'NoUi3/no';
import { EasingTypeName } from 'NoUi3/types';
import { ccclass, v3, Vec3 } from '../../NoUi3/yj';
import { SetMoveTweenToNodeTarget } from './SetMoveTweenToNodeTarget';
import { SetNodeTweenAction } from './SetNodeTweenAction';

/**
 * 
 * Author mqsy_yj
 * DateTime Sat Oct 12 2024 09:38:47 GMT+0800 (中国标准时间)
 * 将当前节点移动到目标节点下作为目标节点的子节点，缓动移动到目标位置
 */

@ccclass('SetMoveToNewParent')
export class SetMoveToNewParent extends SetMoveTweenToNodeTarget {

    protected setTween(targetType: string) {
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            this.scheduleOnce(() => {
                this.setTween(targetType);
            });
            return;
        }

        const pos = no.nodeWorldPosition(this.node),
            p = v3(this.offset.x, this.offset.y, 0);
        no.worldPositionInNode(pos, target.node, pos);
        this.node.parent = target.node;
        no.position(this.node, pos);
        let dis = Vec3.distance(pos, p);
        let duration = this.fixSpeed ? dis / this.speed : this.time;
        this.getComponent(SetNodeTweenAction).setData({
            duration: duration,
            to: 1,
            props: {
                pos: [p.x, p.y]
            },
            easing: EasingTypeName[this.easing]
        });
    }
}
