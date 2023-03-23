
import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../../no';
const { ccclass, property, menu, executeInEditMode } = _decorator;

@ccclass
@menu('NoUi/node/YJLoadPrefab(加载预制体)')
@executeInEditMode()
export default class YJLoadPrefab extends Component {
    @property({ type: Prefab, editorOnly: true })
    prefab: Prefab = null;
    @property
    prefabPath: string = '';

    @property({ editorOnly: true })
    doCheck: boolean = false;

    @property
    autoLoad: boolean = true;

    public loaded: boolean = false;
    public loadedNode: Node = null;
    private loadedPrefab: Prefab = null;

    onLoad() {
        if (EDITOR) return;
        if (!this.autoLoad) return;
        this.loadPrefab();
    }

    onDestroy() {
        this.clear();
    }

    public async loadPrefab(): Promise<Node> {
        if (this.loadedNode != null && this.loadedNode.isValid) return this.loadedNode;
        const path = this.prefabPath.replace('db://assets/', '');
        return new Promise<Node>(resolve => {
            no.assetBundleManager.loadPrefab(path, (p) => {
                if (p == null) resolve(null);
                else {
                    this.loadedPrefab = p;
                    this.loadedNode = instantiate(p);
                    this.loaded = true;
                    resolve(this.loadedNode);
                }
            });
        });
    }

    public clone(): Node {
        if (!this.loadedNode) return null;
        return instantiate(this.loadedNode);
    }

    public instantiateNode(): Node {
        return instantiate(this.loadedPrefab);
    }

    public clear(): void {
        this.loadedNode?.destroy();
        this.loadedNode = null;
        this.loaded = false;
    }

    ////////////EDITOR MODE//////////////////////
    update() {
        if (EDITOR) {
            if (this.doCheck) {
                this.doCheck = false;
                this.setPrefabUrl();
            }
        }
    }

    private setPrefabUrl() {
        if (!this.prefab) return;
        const name = this.prefab.name;
        no.assetBundleManager.getAssetInfoWithNameInEditorMode(`${name}.prefab`, Prefab).then(info => {
            this.prefabPath = info.path;
            this.prefab = null;
        });
    }
}
