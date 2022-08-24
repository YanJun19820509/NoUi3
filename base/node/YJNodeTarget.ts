
import { _decorator, Component, Node, Button, Toggle, v3, Vec2, Vec3, UITransform, EventTouch } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../../no';
const { ccclass, property, menu, executeInEditMode, disallowMultiple } = _decorator;

/**
 * Predefined variables
 * Name = YJNodeTarget
 * DateTime = Fri Jan 14 2022 18:04:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNodeTarget.ts
 * FileBasenameNoExtension = YJNodeTarget
 * URL = db://assets/Script/NoUi3/base/node/YJNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJNodeTarget')
@menu('NoUi/node/YJNodeTarget(节点目标)')
@executeInEditMode()
@disallowMultiple()
export class YJNodeTarget extends Component {
    @property
    type: string = '';
    @property
    autoSet: boolean = false;

    private pos: Vec3;
    private registed: boolean = false;

    onEnable() {
        this.registed = false;
        this.pos = this.node.worldPosition;
    }

    onDisable() {
        no.nodeTargetManager.remove(this.type, this);
    }

    update() {
        if (!EDITOR) {
            if (!this.registed) {
                if (this.pos.equals(this.node.worldPosition)) {
                    this.registed = true;
                    no.nodeTargetManager.register(this.type, this);
                } else this.pos = this.node.worldPosition;
            }
            return;
        }
        if (!this.autoSet) return;
        this.autoSet = false;
        if (this.type != '') return;
        let name = [this.node.name];
        if (this.node.parent) name.unshift(this.node.parent.name);
        this.type = name.join('.');
    }

    public setType(type: string): void {
        if (this.type != '') no.nodeTargetManager.remove(this.type, this);
        this.type = type;
        no.nodeTargetManager.register(this.type, this);
    }


    /**
     * 目标节点的世界坐标
     */
    public get nodeWorldPosition(): Vec3 {
        let p = v3();
        this.node.parent?.getComponent(UITransform).convertToWorldSpaceAR(this.node.position, p);
        return p;
    }

    /**
     * 触摸检测
     * @param e 触摸事件
     * @param trigger 是否触发touch事件，默认true
     * @returns boolean
     */
    public checkTouch(e: EventTouch, trigger = true): boolean {
        let rect = no.nodeBoundingBox(this.node);
        let a = rect.contains(e.getUIStartLocation());
        if (a && trigger) {
            let btn = this.getComponent(Button);
            if (btn instanceof Toggle)
                btn.isChecked = true;
            if (btn.clickEvents.length > 0) no.executeHandlers(btn.clickEvents, e);
        }
        return a;
    }

    /**
     * 获取子节点中的目标节点
     * @param type 
     * @returns 
     */
    public getSubTarget(type: string): YJNodeTarget {
        let arr = this.getComponentsInChildren(YJNodeTarget);
        for (let i = 0, n = arr.length; i < n; i++) {
            if (arr[i].type == type) return arr[i];
        }
    }

}
