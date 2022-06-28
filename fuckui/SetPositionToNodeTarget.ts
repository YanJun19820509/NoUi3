
import { _decorator, Component, Node, UITransform } from 'cc';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { SetPosition } from './SetPosition';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SetPositionToNodeTarget
 * DateTime = Tue Jun 28 2022 18:45:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPositionToNodeTarget.ts
 * FileBasenameNoExtension = SetPositionToNodeTarget
 * URL = db://assets/NoUi3/fuckui/SetPositionToNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetPositionToNodeTarget')
export class SetPositionToNodeTarget extends SetPosition {

    protected onDataChange(data: any) {
        this.setPosition(data);
    }

    private setPosition(targetType: string) {
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            this.scheduleOnce(() => {
                this.setPosition(targetType);
            });
            return;
        }

        let pos = target.nodeWorldPosition;
        this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        super.onDataChange(pos);
    }

}
