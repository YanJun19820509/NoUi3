import { no } from "../../no";
import { ccclass, Component, disallowMultiple, Node, property, Vec3 } from "../../yj";

/**
 * 动态设置父节点
 * 功能说明：
 * 运行时改变节点的父节点
 * 用于一些特殊情况，比如节点的属性状态受原父节点影响，但层级需要脱离原父节点限制的时候
 */
@ccclass('YJDynamicSetParent')
@disallowMultiple()
export class YJDynamicSetParent extends Component {
    @property(Node)
    newParent: Node = null;

    private _oldParent: Node = null;
    private _oldParentPos: Vec3;
    private _oldPos: Vec3;

    protected onEnable(): void {
        if (this.newParent) {
            this.scheduleOnce(this.changeParent, 1);
        }
    }

    protected onDisable(): void {
        // this.resetParent();
    }

    private changeParent() {
        if (!this._oldParent) {
            this._oldParent = this.node.parent;
            this._oldParentPos = this._oldParent.position.clone();
            this._oldParent.on(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
        }
        this._oldPos = this.node.position.clone();
        const newPos = no.nodePositionInOtherNode(this.node, this.newParent);
        this.node.parent = this.newParent;
        this.node.setPosition(newPos);
    }

    private resetParent() {
        this.node.parent = this._oldParent;
        this.node.setPosition(this._oldPos);
        this._oldParent.off(Node.EventType.TRANSFORM_CHANGED, this.onTransformChanged, this);
    }

    private onTransformChanged(type: number) {
        if (type & Node.TransformBit.POSITION) {
            let pos = no.position(this._oldParent);
            let x = pos.x - this._oldParentPos.x;
            let y = pos.y - this._oldParentPos.y;
            let selfPos = this.node.position;
            this.node.setPosition(selfPos.x + x, selfPos.y + y);
        }
        if (type & Node.TransformBit.ROTATION) {
            no.rotation(this.node, no.rotation(this._oldParent));
        }
        if (type & Node.TransformBit.SCALE) {
            no.scale(this.node, no.scale(this._oldParent));
        }
    }
}