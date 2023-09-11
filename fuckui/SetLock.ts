
import { ccclass, property, menu, Node, UITransform, Button, EDITOR, BlockInputEvents, Layers, Enum, Size, instantiate, UIOpacity } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetGray } from './SetGray';

/**
 * Predefined variables
 * Name = SetLock
 * DateTime = Thu Mar 24 2022 17:36:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetLock.ts
 * FileBasenameNoExtension = SetLock
 * URL = db://assets/NoUi3/base/node/SetLock.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

enum LockType {
    Gray = 0,
    Hide
}

@ccclass('SetLock')
@menu('NoUi/ui/SetLock(给节点上锁:boolean)')
export class SetLock extends FuckUi {
    @property({ type: Node })
    target: Node = null;

    @property({ type: Enum(LockType) })
    lockType: LockType = LockType.Hide;

    @property({ type: Node, visible() { return this.lockType != LockType.Hide; } })
    lockNode: Node = null;

    @property
    locked: boolean = true;
    @property({ displayName: '取反' })
    reverse: boolean = false;

    @property(no.EventHandlerInfo)
    onLocked: no.EventHandlerInfo[] = [];

    private _lockType: LockType;

    start() {
        if (EDITOR) return;
        if (this.dataSetted) return;
        if (this.locked) this.onDataChange(this.locked);
    }

    update() {
        if (!EDITOR) return;
        if (this._lockType == this.lockType) return;
        this._lockType = this.lockType;
        if (this.lockType == LockType.Gray && !this.getComponent(SetGray)) this.addComponent(SetGray);
        else if (this.lockType != LockType.Gray) this.getComponent(SetGray)?.destroy();
    }

    onDataChange(d: any) {
        if (!this.target) this.target = this.node;
        this.locked = Boolean(d);
        if (this.reverse) this.locked = !this.locked;
        if (this.locked) this.setLock();
        else this.setUnlock();
    }

    public a_check(): void {
        if (this.locked) {
            no.EventHandlerInfo.execute(this.onLocked);
        }
    }

    private setLock() {
        if (this.lockType == LockType.Gray) {
            this.createLockNode();
            this.setGray(true);
        } else if (this.lockType == LockType.Hide) {
            no.visible(this.target, false);
        }
    }

    private setUnlock() {
        if (this.lockType == LockType.Gray) {
            this.target.getChildByName('_lock_')?.destroy();
            this.setGray(false);
        } else if (this.lockType == LockType.Hide) {
            no.visible(this.target, true);
        }
    }

    private setGray(v: boolean) {
        no.visible(this.lockNode, v);
        let a = this.target.getComponent(SetGray) || this.target.addComponent(SetGray);
        a.setData(no.jsonStringify(v));
    }

    private createLockNode() {
        let target = this.target;
        if (target.getChildByName('_lock_')) return;
        let lock: Node;
        if (this.lockNode) {
            lock = instantiate(this.lockNode);
            lock.name = '_lock_';
            lock.active = true;
        } else {
            let nodeUt = target.getComponent(UITransform);
            lock = new Node('_lock_');
            lock.layer = Layers.Enum.UI_2D;
            let ut = lock.addComponent(UITransform);
            ut.setContentSize(nodeUt.getBoundingBox().size);
            ut.setAnchorPoint(nodeUt.anchorPoint);
        }
        lock.setPosition(0, 0);
        no.addClickEventsToButton(lock.addComponent(Button), target, 'SetLock', 'a_check');
        lock.addComponent(BlockInputEvents);
        lock.parent = target;
    }
}
