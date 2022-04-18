
import { _decorator, Node, UITransform, Button, EventHandler, BlockInputEvents, Layers, Enum, UIOpacity, Size, size } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetGray } from './SetGray';
const { ccclass, property, menu } = _decorator;

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
    @property({ type: Enum(LockType) })
    lockType: LockType = LockType.Gray;

    @property({ type: SetGray, visible() { return this.lockType == LockType.Gray; } })
    setGray: SetGray = null;

    @property
    locked: boolean = true;

    @property(no.EventHandlerInfo)
    onLocked: no.EventHandlerInfo[] = [];

    private size: Size;

    start() {
        if (this.locked) this.createLockNode();
    }

    onDataChange(d: any) {
        this.locked = Boolean(d);
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
            this.setGray?.setData('true');
        } else {
            let t = this.getComponent(UITransform);
            if (!this.size)
                this.size = t.getBoundingBox().size;
            t.setContentSize(size(0, 0));
        }
    }

    private setUnlock() {
        if (this.lockType == LockType.Gray) {
            this.node.getChildByName('_lock_')?.destroy();
            this.setGray?.setData('false');
        } else if (this.size) {
            let t = this.getComponent(UITransform);
            t.setContentSize(this.size);
        }
    }

    private createLockNode() {
        if (this.node.getChildByName('_lock_')) return;
        let nodeUt = this.node.getComponent(UITransform);
        let lock = new Node('_lock_');
        lock.layer = Layers.Enum.UI_2D;
        let ut = lock.addComponent(UITransform);
        ut.setContentSize(nodeUt.getBoundingBox().size);
        ut.setAnchorPoint(nodeUt.anchorPoint);
        lock.setPosition(0, 0);
        let a = new EventHandler();
        a.target = this.node;
        a.component = 'SetLock';
        // a._componentName = 'SetLock';
        // a._componentId = js._getClassId(SetLock);
        a.handler = 'a_check';
        let btn = lock.addComponent(Button);
        btn.clickEvents = [a];
        lock.addComponent(BlockInputEvents);
        lock.parent = this.node;
    }
}
