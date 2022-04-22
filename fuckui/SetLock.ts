
import { _decorator, Node, UITransform, Button, EventHandler, BlockInputEvents, Layers, Enum, Size } from 'cc';
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
    @property
    target: Node = null;

    @property({ type: Enum(LockType) })
    lockType: LockType = LockType.Gray;

    @property
    locked: boolean = true;

    @property(no.EventHandlerInfo)
    onLocked: no.EventHandlerInfo[] = [];

    private size: Size;

    start() {
        if (this.dataSetted) return;
        if (this.locked) this.onDataChange(this.locked);
    }

    onDataChange(d: any) {
        if (!this.target) this.target = this.node;
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
            this.setGray(true);
        } else {
            this.target.active = false;
        }
    }

    private setUnlock() {
        if (this.lockType == LockType.Gray) {
            this.target.getChildByName('_lock_')?.destroy();
            this.setGray(false);
        } else if (this.size) {
            this.target.active = true;
        }
    }

    private createLockNode() {
        let target = this.target;
        if (target.getChildByName('_lock_')) return;
        let nodeUt = target.getComponent(UITransform);
        let lock = new Node('_lock_');
        lock.layer = Layers.Enum.UI_2D;
        let ut = lock.addComponent(UITransform);
        ut.setContentSize(nodeUt.getBoundingBox().size);
        ut.setAnchorPoint(nodeUt.anchorPoint);
        lock.setPosition(0, 0);
        let a = new EventHandler();
        a.target = target;
        a.component = 'SetLock';
        // a._componentName = 'SetLock';
        // a._componentId = js._getClassId(SetLock);
        a.handler = 'a_check';
        let btn = lock.addComponent(Button);
        btn.clickEvents = [a];
        lock.addComponent(BlockInputEvents);
        lock.parent = target;
    }

    private setGray(v: boolean) {
        let a = this.target.getComponent(SetGray) || this.target.addComponent(SetGray);
        a.setData(JSON.stringify(v));
    }
}
