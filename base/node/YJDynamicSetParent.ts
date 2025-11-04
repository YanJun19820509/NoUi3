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
    private _oldPos: Vec3;

    onLoad() {
        this._oldParent = this.node.parent;
    }
    protected onEnable(): void {
        if (this.newParent) {
            this._oldPos = this.node.position.clone();
            const newPos = no.nodePositionInOtherNode(this.node, this.newParent);
            this.node.parent = this.newParent;
            this.node.setPosition(newPos);
        }
    }

    protected onDisable(): void {
        this.node.parent = this._oldParent;
        this.node.setPosition(this._oldPos);
    }
}