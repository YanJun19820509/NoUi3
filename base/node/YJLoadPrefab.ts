
import { EDITOR, ccclass, property, menu, Component, Node, Prefab } from '../../yj';
import { no } from '../../no';

@ccclass
@menu('NoUi/node/YJLoadPrefab(加载预制体)')
export default class YJLoadPrefab extends Component {
    @property({ type: Prefab, editorOnly: true })
    public get prefab(): Prefab {
        return null;
    }

    public set prefab(v: Prefab) {
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            if (!url) return;
            this.prefabUrl = url;
        });
    }
    @property({ readonly: true })
    prefabUrl: string = '';

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
}
