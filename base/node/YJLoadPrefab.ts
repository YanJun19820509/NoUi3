
import { _decorator, Component, Node, instantiate } from 'cc';
import { no } from '../../no';
const { ccclass, property, menu, executeInEditMode } = _decorator;

@ccclass
@menu('NoUi/node/YJLoadPrefab(加载预制体)')
export default class YJLoadPrefab extends Component {

    @property
    prefabUrl: string = '';
    @property
    autoLoad: boolean = true;

    public loaded: boolean = false;
    public loadedNode: Node = null;

    onLoad() {
        if (!this.autoLoad) return;
        this.loadPrefab();
    }

    onDestroy() {
        this.loadedNode?.destroy();
    }

    public async loadPrefab(): Promise<Node> {
        if (this.loadedNode != null && this.loadedNode.isValid) return this.loadedNode;
        return new Promise<Node>(resolve => {
            no.assetBundleManager.loadPrefab(this.prefabUrl, (p) => {
                if (p == null) resolve(null);
                else {
                    this.loadedNode = instantiate(p);
                    this.loaded = true;
                    no.assetBundleManager.decRef(p);
                    resolve(this.loadedNode);
                }
            });
        });
    }

    public clone(): Node {
        if (!this.loadedNode) return null;
        return instantiate(this.loadedNode);
    }

    public clear(): void {
        this.loadedNode = null;
        this.loaded = false;
    }
}
