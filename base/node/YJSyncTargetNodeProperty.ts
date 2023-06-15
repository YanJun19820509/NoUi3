import { _decorator, Component, Node } from './yj';
import { no } from '../../no';
const { ccclass, property } = _decorator;

@ccclass('YJSyncTargetNodeProperty')
export class YJSyncTargetNodeProperty extends Component {
    @property(Node)
    target: Node = null;
    @property({ displayName: '同步到target', tooltip: '从本节点同步到target或从target同步到本节点' })
    syncTo: boolean = false;

    protected onLoad(): void {
        if (!this.target) this.update = () => { };
    }

    protected update(dt: number): void {
        let from: Node, to: Node;
        this.syncTo ? (from = this.node, to = this.target) : (from = this.target, to = this.node);
        no.position(to, no.position(from));
        no.rotation(to, no.rotation(from));
        no.scale(to, no.scale(from));
    }
}


