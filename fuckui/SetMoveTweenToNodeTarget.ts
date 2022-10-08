
import { _decorator, Component, Node, UITransform, v3, Vec3, math } from 'cc';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetNodeTweenAction } from './SetNodeTweenAction';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetMoveTweenToNodeTarget
 * DateTime = Wed Jun 29 2022 18:05:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetMoveTweenToNodeTarget.ts
 * FileBasenameNoExtension = SetMoveTweenToNodeTarget
 * URL = db://assets/NoUi3/fuckui/SetMoveTweenToNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetMoveTweenToNodeTarget')
@requireComponent(SetNodeTweenAction)
export class SetMoveTweenToNodeTarget extends FuckUi {
    @property({ min: 1 })
    speed: number = 10;
    @property
    offset: math.Vec2 = math.v2();

    protected onDataChange(data: any) {
        this.setTween(data);
    }

    private setTween(targetType: string) {
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
        let duration = dis / this.speed;
        this.getComponent(SetNodeTweenAction).setData(JSON.stringify({
            duration: duration,
            to: 1,
            props: {
                pos: [pos.x + this.offset.x, pos.y + this.offset.y]
            }
        }));
    }
}
