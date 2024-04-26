
import { EDITOR, ccclass, property, menu, executeInEditMode, Component, Node, instantiate, Prefab } from '../../yj';
import { no } from '../../no';

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

    public loaded: boolean = false;

    onLoad() {
        if (EDITOR) return;
        if (!this.autoLoad) return;
        this.loadPrefab();
    }

    onDestroy() {
        this.clear();
    }

    public async loadPrefab(): Promise<Node> {
        const node = this.instantiateNode();
        if (node) return node;
        else if (no.assetBundleManager.isAssetLoading(this.prefabUrl)) {
            await no.sleep(0);
            return this.loadPrefab();
        } else {
            no.assetBundleManager.loadingAsset(this.prefabUrl);
            return new Promise<Node>(resolve => {
                no.assetBundleManager.loadPrefab(this.prefabUrl, (p) => {
                    if (p == null) resolve(null);
                    else {
                        no.assetBundleManager.setPrefabNode(this.prefabUrl, p);
                        this.loaded = true;
                        resolve(this.instantiateNode());
                        no.assetBundleManager.assetLoadingEnd(this.prefabUrl);
                    }
                });
            });
        }
    }

    public instantiateNode(): Node {
        return no.assetBundleManager.getPrefabNode(this.prefabUrl);
    }

    public clear(): void {
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

    private setPrefabUrl() {
        no.getAssetUrlInEditorMode(this.prefab._uuid, url => {
            if (!url) return;
            this.prefabUrl = url;
            this.prefab = null;
        });
    }
}
