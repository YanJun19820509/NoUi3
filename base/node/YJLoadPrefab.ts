
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

    onLoad() {
        if (!this.autoLoad) return;
        this.loadPrefab();
    }

    onDestroy() {
        this.loadedNode?.destroy();
        this.loadedNode = null;
        this.loaded = false;
        no.assetBundleManager.release(this.prefUuid, true);
    }

    public async loadPrefab(): Promise<Node> {
        if (this.loadedNode != null && this.loadedNode.isValid) return this.loadedNode;
        this.url = this.prefabUrl.replace('db://assets/', '').replace('.prefab', '');
        return new Promise<Node>(resolve => {
            no.assetBundleManager.loadPrefab(this.url, (p) => {
                if (p == null) resolve(null);
                else {
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

    public clear(): void {
        
    }

    ////////////EDITOR MODE//////////////////////
    update() {
        if (EDITOR) {
            if (this.prefab != null) {
                this.setPrefabUrl();
            }
        }
    }

    private async setPrefabUrl() {
        let url = await no.getAssetUrlInEditorMode(this.prefab._uuid);
        this.prefabUrl = url;
        // this.prefabUuid = this.prefab._uuid;
        this.prefab = null;
    }
}
