import { ccclass, property, menu, Component, Node, Prefab, instantiate } from '../../yj';
import { no } from '../../no';

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
        no.EditorMode.getAssetUrlByUuid(v._uuid).then(url => {
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
    /** 
     * 预制体资源配置列表（支持多预制体加载）
     * @property {YJLoadPrefabsInfo[]} prefabs - 包含多个预制体配置信息
     * @example
     * // 在属性检查器中：
     * // 1. 设置数组长度
     * // 2. 为每个元素配置key和prefab资源
     * // 3. 运行时自动生成prefabUrl
     */
    @property({ type: [YJLoadPrefabsInfo] })
    prefabs: YJLoadPrefabsInfo[] = [];

    /** 
     * 材质配置UUID（与YJLoadAssets配合使用）
     * @property {string} materialInfoUuid - 用于批量设置子节点材质的配置标识
     * @remarks 通过YJLoadAssets统一管理材质继承关系
     */
    @property({ visible() { return false; } })
    materialInfoUuid: string;

    /** 
     * 加载状态标识
     * @public {boolean} loaded - 表示所有预制体是否已完成加载
     * @example
     * // 检查加载状态：
     * if(loader.loaded) {
     *   // 执行实例化操作
     * }
     */
    public loaded: boolean = false;

    /** 存储已加载的预制体节点实例（键值对形式） */
    private _loadedNodes: Map<string, Node>;

    /** 组件加载时自动触发预制体加载 */
    onLoad() {
        this.loadPrefab();
    }

    /** 组件销毁时自动清理资源 */
    onDestroy() {
        this.clear();
    }

    /**
     * 批量加载预制体资源
     * @remarks
     * 加载流程：
     * 1. 遍历prefabs配置列表获取所有预制体URL
     * 2. 通过assetBundleManager异步加载资源
     * 3. 加载完成后实例化所有预制体并缓存
     * 
     * @example
     * // 手动触发重新加载：
     * this.loadPrefab();
     */
    private loadPrefab() {
        this._loadedNodes = new Map();
        const arr: any[] = [];
        // 构建资源加载参数数组
        for (let i = 0; i < this.prefabs.length; i++) {
            const item = this.prefabs[i];
            arr.push({ url: item.prefabUrl, k: item.key });
        }
        // 异步加载所有预制体资源
        no.assetBundleManager.loadAnyFiles(arr, null, (items: Prefab[]) => {
            // 实例化并缓存预制体节点
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                this._loadedNodes.set(arr[i].k, instantiate(item));
            }
            this.loaded = true; // 更新加载状态
        });
    }

    /**
     * 获取指定预制体实例
     * @param key 预制体配置的key值
     * @returns 新的预制体节点实例（需手动添加到场景）
     * @example
     * // 获取并显示敌人预制体：
     * const enemyNode = this.loader.getNode('enemy');
     * if(enemyNode) this.node.addChild(enemyNode);
     */
    public getNode(key: string): Node | null {
        return this._loadedNodes.has(key) ? instantiate(this._loadedNodes.get(key)) : null;
    }

    /** 
     * 清理所有加载资源
     * @remarks 释放内存并重置状态，适用于场景切换时调用
     * @example
     * // 切换关卡时清理：
     * this.loader.clear();
     */
    public clear(): void {
        this.loaded = false;
        // 销毁所有缓存的预制体实例
        this._loadedNodes.forEach(item => {
            item.destroy();
        });
        this._loadedNodes.clear();
    }
}
