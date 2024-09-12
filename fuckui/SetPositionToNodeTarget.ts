
import { ccclass, property, Component, Node, UITransform, math, Vec2, Camera } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { FuckUi } from './FuckUi';

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
export class SetPositionToNodeTarget extends FuckUi {
    @property
    offset: Vec2 = math.v2();

    private _is3d = false;

    onLoad() {
        super.onLoad();
        this._is3d = no.is3DNode(this.node);
    }

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
        const isTarget3d = no.is3DNode(target.node);
        if (isTarget3d == this._is3d) {
            no.worldPosition(this.node, target.nodeWorldPosition);
        } else {
            //target是2d
            if (!isTarget3d) {
                no.worldPosition(this.node, no.convert2DPositionTo3D(target.node, this.node));
            } else {
                no.position(this.node, no.convert3DPositionTo2D(target.node, this.node.parent));
            }
        }
    }

}
