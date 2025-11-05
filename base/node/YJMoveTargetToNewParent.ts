import { ccclass, Component, Node, property } from "../../yj";
import { no } from "../../no";
import { nodeTargetManager } from "../../NodeTargetManager";
import { YJNodeTarget } from "./YJNodeTarget";
/**
 * 将目标节点移动到新的父节点
 * Author mqsy_yj
 * DateTime Wed Nov 05 2025 09:24:02 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJMoveTargetToNewParent')
export class YJMoveTargetToNewParent extends Component {
    @property(Node)
    newParent: Node = null;
    @property
    targets: string[] = [];
    @property({ displayName: '是否重置', tooltip: '在disable时将目标节点重置到原来的父节点' })
    resetOnDisable: boolean = true;


    private _showTargets: { targetName?: string, targetNode: Node, pos: { x: number, y: number }, tempNode: Node }[] = [];

    protected onEnable(): void {
        if (this.newParent) {
            this.setShowTargets(this.targets, this.newParent);
        }
    }

    protected onDisable(): void {
        if (this.resetOnDisable) {
            this.resetShowTargets();
        }
    }

    /**
     * 设置显示目标节点
     * @param targets 目标节点名称列表
     */
    public setShowTargets(targets: string[], newParent: Node) {
        for (let i = 0, n = targets.length; i < n; i++) {
            this._showTarget(targets[i], newParent);
        }
    }

    private _showTarget(targetName: string, newParent: Node) {
        if (this._showTargets.find(target => target.targetName === targetName)) return;
        let target = nodeTargetManager.get<YJNodeTarget>(targetName);
        if (!target) {
            console.error(`TalkFinger: target ${targetName} not found, try again in 0.5s`);
            this.scheduleOnce(() => {
                this._showTarget(targetName, newParent);
            }, .5);
            return;
        }
        this.moveNodeToShowContainer(target.node, targetName, newParent);
    }

    private moveNodeToShowContainer(node: Node, targetName: string, newParent: Node) {
        const { x, y } = node.position;
        const size = no.size(node);
        const targetParent = node.parent;
        const newNode = no.newNode('temp');
        no.size(newNode, size);
        newNode.setPosition(x, y);
        newNode.parent = targetParent;
        newNode.setSiblingIndex(node.getSiblingIndex());
        const pos = no.nodePositionInOtherNode(node, newParent);
        node.parent = newParent;
        node.position = pos;
        this._showTargets.push({ targetName, targetNode: node, pos: { x, y }, tempNode: newNode });
    }

    /**
     * 重置显示目标节点
     */
    public resetShowTargets() {
        for (let i = 0, n = this._showTargets.length; i < n; i++) {
            const { targetNode, pos, tempNode } = this._showTargets[i];
            targetNode.parent = tempNode.parent;
            targetNode.setSiblingIndex(tempNode.getSiblingIndex());
            targetNode.setPosition(pos.x, pos.y);
            tempNode.destroy();
        }
        this._showTargets.length = 0;
    }
}