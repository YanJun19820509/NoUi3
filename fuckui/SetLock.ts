
import { _decorator, Node, UITransform, Button, EventHandler, BlockInputEvents, Layers, Enum, Size, instantiate } from 'cc';
import { EDITOR } from 'cc/env';
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
    Hide,
    Sprite
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
        if (this.locked) this.setLock();
        else this.setUnlock();
    }

    public a_check(): void {
        if (this.locked) {
            no.EventHandlerInfo.execute(this.onLocked);
        }
    }

    private setLock() {
        if (this.lockType != LockType.Hide) {
            this.createLockNode();
            this.setGray(this.lockType == LockType.Gray);
        } else {
            this.target.active = false;
        }
    }

    private setUnlock() {
        if (this.lockType != LockType.Hide) {
            this.target.getChildByName('_lock_')?.destroy();
            if (this.lockType == LockType.Gray)
                this.setGray(false);
        } else {
            this.target.active = true;
        }
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
