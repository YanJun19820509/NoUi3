
import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { EDITOR } from 'cc/env';
import { YJLoadAssets } from '../../editor/YJLoadAssets';
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
    @property({ readonly: true })
    prefabUuid: string = '';

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
            no.assetBundleManager.loadByUuid<Prefab>(this.prefabUuid, Prefab, (p) => {
                if (p == null) resolve(null);
                else {
                    this.loadedNode = instantiate(p);
                    this.loaded = true;
                    no.assetBundleManager.decRef(p);
                    this.loadedNode.getComponent(YJLoadAssets)?.load();
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
        this.prefabUuid = this.prefab._uuid;
        this.prefab = null;
    }
}
