import { ccclass, property, menu, Component, Node, Prefab, instantiate } from '../../yj';
import { no } from '../../no';
import { YJLoadAssets } from 'NoUi3/editor/YJLoadAssets';

@ccclass('YJLoadPrefabsInfo')
class YJLoadPrefabsInfo {
    @property
    key: string = '';
    /** 预制体资源 */
    @property({ type: Prefab })
    public get prefab(): Prefab {
        return null;
    }

    /** 设置预制体时获取其url */
    public set prefab(v: Prefab) {
        no.EditorMode.getAssetUrlByUuid(v.uuid).then(url => {
            if (!url) return;
            this.prefabUrl = url;
        });
    }

    /** 预制体资源url */
    @property({ readonly: true })
    prefabUrl: string = '';
}

@ccclass
@menu('NoUi/node/YJLoadPrefabs(加载预制体)')
/**
 * 预制体加载组件,一次加载多个预制体
 * Author mqsy_yj
 * DateTime 2024/1/8
 */
export default class YJLoadPrefabs extends Component {
    @property({ type: [YJLoadPrefabsInfo] })
    prefabs: YJLoadPrefabsInfo[] = [];

    /** 材质信息uuid */
    @property({ visible() { return false; } })
    materialInfoUuid: string;

    /** 是否已加载完成 */
    public loaded: boolean = false;

    private _loadedNodes: Map<string, Node>;

    /** 组件加载时自动加载预制体 */
    onLoad() {
        this.loadPrefab();
    }

    /** 组件销毁时清理 */
    onDestroy() {
        this.clear();
    }

    /**
     * 加载预制体
     * @returns 预制体节点实例
     */
    private loadPrefab() {
        this._loadedNodes = new Map();
        const arr: any[] = [];
        for (let i = 0; i < this.prefabs.length; i++) {
            const item = this.prefabs[i];
            arr.push({ url: item.prefabUrl, k: item.key });
        }
        no.assetBundleManager.loadAnyFiles(arr, null, (items: Prefab[]) => {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                this._loadedNodes.set(arr[i].k, instantiate(item));
            }
        });
    }

    public getNode(key: string) {
        return instantiate(this._loadedNodes[key]);
    }

    /** 清理加载状态 */
    public clear(): void {
        this.loaded = false;
        this._loadedNodes.forEach(item => {
            item.destroy();
        });
        this._loadedNodes.clear();
    }
}
