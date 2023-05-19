
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
    @property({ readonly: true })
    prefabUrl: string = '';
    // @property({ readonly: true })
    // prefabUuid: string = '';

    @property
    autoLoad: boolean = true;

    private url: string;
    public loaded: boolean = false;
    public loadedNode: Node = null;
    private prefUuid: string;
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
        this.url = this.prefabUrl.replace('db://assets/', '').replace('.prefab', '');
        return new Promise<Node>(resolve => {
            no.assetBundleManager.loadPrefab(this.url, (p) => {
                if (p == null) resolve(null);
                else {
                    this.loadedPrefab = p;
                    this.prefUuid = p._uuid;
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
        // no.assetBundleManager.release(this.prefUuid, false);
    }

    ////////////EDITOR MODE//////////////////////
    update() {
        if (EDITOR) {
            if (this.prefab != null) {
                this.setPrefabUrl();
            }
        }
    }

    private setPrefabUrl() {
        no.getAssetUrlInEditorMode(this.prefab._uuid, url => {
            if (!url) return;
            this.prefabUrl = url;
            this.prefab = null;
        });
    }
}
