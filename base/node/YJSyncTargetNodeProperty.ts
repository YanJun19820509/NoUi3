import { ccclass, property, Component, Node, executeInEditMode, EDITOR } from '../../yj';
import { no } from '../../no';

@ccclass('YJSyncTargetNodeProperty')
@executeInEditMode()
export class YJSyncTargetNodeProperty extends Component {
    @property({ displayName: '同步到target', tooltip: '从本节点同步到target或从target同步到本节点' })
    syncTo: boolean = false;
    @property({ type: Node, visible() { return !this.syncTo } })
    target: Node = null;
    @property({ type: Node, visible() { return this.syncTo } })
    toTargets: Node[] = [];
    @property
    syncOnEditor: boolean = false;

    protected onLoad(): void {
        if (!this.target && this.toTargets.length == 0) this.update = () => { };
    }

    protected update(dt: number): void {
        if (EDITOR && !this.syncOnEditor) return;
        this.syncTo ? this.syncToTargets() : this.syncFromTarget();
    }

    private syncFromTarget() {
        const from = this.target;
        const to = this.node;
        const p = from.position;
        const r = from.eulerAngles;
        const s = from.scale;
        no.position(to, p);
        no.rotation(to, r);
        no.scale(to, s);
    }

    private syncToTargets() {
        const from = this.node;
        const p = from.position;
        const r = from.eulerAngles;
        const s = from.scale;
        for (const to of this.toTargets) {
            no.position(to, p);
            no.rotation(to, r);
            no.scale(to, s);
        }
    }
}


