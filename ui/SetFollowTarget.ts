import { ccclass, Node, property, Vec3 } from 'hackUi/yj';
import { HackUi } from 'hackUi/ui/HackUi';
import { no } from '../no';
import { YJNodeTarget } from '../base/node/YJNodeTarget';

/**
 * 跟随目标,状态同步
 * Author mqsy_yj
 * DateTime Mon Jul 28 2025 17:20:35 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetFollowTarget')
export class SetFollowTarget extends HackUi {
    @property
    syncPos: boolean = true;
    @property({ visible() { return this.syncPos } })
    posOffset: Vec3 = new Vec3();
    @property
    syncScale: boolean = true;
    @property({ visible() { return this.syncScale } })
    reserve: boolean = false;

    private _target: Node = null;
    private _targetName: string = '';
    private _selfScale: Vec3 = null;
    private _dir: number = 1;

    protected onDataChange(data: any) {
        if (data == 'null') {
            this.clearTarget();
        } else {
            this.initTarget(data);
        }
    }

    private clearTarget() {
        this._targetName = '';
        if (this._target) {
            this._target.off(Node.EventType.TRANSFORM_CHANGED, this.onTargetTransformChanged, this);
            this._target = null;
        }
    }

    private initTarget(targetName: string) {
        if (this._targetName == targetName) {
            this.onTargetTransformChanged();
            return;
        }
        this._targetName = targetName;
        this._target = no.nodeTargetManager.get<YJNodeTarget>(targetName)?.node;
        if (!this._target) {
            this.scheduleOnce(() => {
                this.initTarget(targetName);
            });
            return;
        }
        this._target.on(Node.EventType.TRANSFORM_CHANGED, this.onTargetTransformChanged, this);
        this.onTargetTransformChanged();
    }

    private onTargetTransformChanged() {
        if (!this._target) return;
        if (this.syncScale) {
            if (!this._selfScale) this._selfScale = this.node.scale.clone();
            const scale = this._target.scale;
            let a = 1;
            if (this.reserve) {
                a = -1;
            }
            this.node.setScale(scale.x * a * this._selfScale.x, scale.y * a * this._selfScale.y, scale.z * a * this._selfScale.z);
        }
        if (this.syncPos) {
            const pos = this._target.position;
            this.node.setPosition(pos.x + this.posOffset.x * this._dir, pos.y + this.posOffset.y, pos.z + this.posOffset.z);
        }
    }

    public setDir(dir: number) {
        this._dir = dir;
        this.onTargetTransformChanged();
    }
}
