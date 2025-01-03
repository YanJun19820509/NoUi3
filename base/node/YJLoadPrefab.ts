import { EDITOR, ccclass, property, menu, Component, Node, Prefab } from '../../yj';
import { no } from '../../no';
import { YJLoadAssets } from 'NoUi3/editor/YJLoadAssets';

@ccclass
@menu('NoUi/node/YJLoadPrefab(加载预制体)')
/**
 * 预制体加载组件
 * Author mqsy_yj
 * DateTime 2024/1/8
 */
export default class YJLoadPrefab extends Component {
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

    /** 是否自动加载预制体 */
    @property
    autoLoad: boolean = true;

    /** 材质信息uuid */
    @property({ visible() { return false; } })
    materialInfoUuid: string;

    /** 是否已加载完成 */
    public loaded: boolean = false;

    /** 组件加载时自动加载预制体 */
    onLoad() {
        if (EDITOR) return;
        if (!this.autoLoad) return;
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
    public async loadPrefab(): Promise<Node> {
        // 1. 首先检查是否已有缓存的节点
        const cachedNode = this.instantiateNode();
        if (cachedNode) return cachedNode;

        // 2. 等待其他正在进行的加载完成
        while (no.assetBundleManager.isAssetLoading(this.prefabUrl)) {
            await no.sleep(0.02); // 增加等待时间，减少循环次数
        }

        // 3. 开始加载资源
        no.assetBundleManager.loadingAsset(this.prefabUrl);

        try {
            const prefab = await new Promise<Prefab>((resolve, reject) => {
                no.assetBundleManager.loadPrefab(this.prefabUrl, (p) => {
                    if (p == null) reject(new Error('Failed to load prefab'));
                    else resolve(p);
                });
            });

            // 4. 加载成功后的处理
            no.assetBundleManager.setPrefabNode(this.prefabUrl, prefab);
            this.loaded = true;
            const node = this.instantiateNode();
            no.assetBundleManager.assetLoadingEnd(this.prefabUrl);
            return node;

        } catch (error) {
            // 5. 处理加载失败的情况
            no.assetBundleManager.assetLoadingEnd(this.prefabUrl);
            console.error(`Failed to load prefab: ${this.prefabUrl}`, error);
            return null;
        }
    }

    /**
     * 实例化预制体节点
     * @returns 预制体节点实例
     */
    public instantiateNode(): Node {
        const node = no.assetBundleManager.getPrefabNode(this.prefabUrl);
        if (node)
            YJLoadAssets.setMaterialInfoUuidToSubNode(node, this.materialInfoUuid);
        return node;
    }

    /** 清理加载状态 */
    public clear(): void {
        this.loaded = false;
    }
}
