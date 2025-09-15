import { EDITOR, ccclass, property, menu, Component, Node, Prefab, instantiate, executeInEditMode } from '../../yj';
import { YJLoadAssets } from '../../editor/YJLoadAssets';
import { no } from '../../no';
import { PrefabInfo } from '../../types';

@ccclass
@menu('NoUi/node/YJLoadPrefab(加载预制体)')
/**
 * 预制体加载组件
 * Author mqsy_yj
 * DateTime 2024/1/8
 * 
 * @remarks
 * 功能特性：
 * - 支持在编辑器模式和运行时加载预制体
 * - 自动处理材质信息继承
 * - 提供加载状态跟踪和资源清理
 * 
 * @example
 * // 在场景中创建空节点并添加本组件
 * // 1. 配置prefabInfo选择预制体资源
 * // 2. 在代码中调用加载：
 * const loader = this.node.getComponent(YJLoadPrefab);
 * const prefabNode = await loader.loadPrefab();
 * if(prefabNode) this.node.addChild(prefabNode);
 */
export default class YJLoadPrefab extends Component {
    /** 
     * 预制体资源配置信息
     * @property {PrefabInfo} prefabInfo - 包含预制体路径/UUID等元数据
     * @example
     * // 在属性检查器中配置：
     * // 点击prefabInfo的放大镜图标选择预制体资源
     */
    @property({ type: PrefabInfo })
    prefabInfo: PrefabInfo = new PrefabInfo();

    /** 
     * 材质配置UUID（编辑器专用）
     * @property {string} materialInfoUuid - 用于批量设置子节点材质的配置标识
     * @remarks 通过YJLoadAssets统一管理材质继承关系
     */
    @property({ visible() { return false; } })
    materialInfoUuid: string = '';

    @property
    preload: boolean = false;

    private _tempNode: Node = null;

    /** 
     * 加载状态标识
     * @public {boolean} loaded - 表示预制体是否已完成加载
     * @example
     * // 检查加载状态：
     * if(loader.loaded) {
     *   // 执行后续逻辑
     * }
     */
    public loaded: boolean = false;

    onLoad() {
        if (this.preload) {
            this.loadPrefab();
        }
    }

    /** 组件销毁时清理资源引用 */
    onDestroy() {
        this.clear();
    }

    /**
     * 异步加载预制体实例
     * @returns {Promise<Node>} 加载完成的预制体节点实例（自动实例化）
     * @example
     * // 基本使用：
     * const node = await this.loader.loadPrefab();
     * 
     * // 带错误处理：
     * try {
     *   const enemy = await loader.loadPrefab();
     *   enemy.parent = this.battleLayer;
     * } catch(e) {
     *   console.error('敌人预制体加载失败', e);
     * }
     */
    public async loadPrefab(): Promise<Node> {
        if (this._tempNode) {
            return instantiate(this._tempNode);
        }
        return new Promise<Node>(resolve => {
            this.prefabInfo.loadAsset<Prefab>(prefab => {
                if (prefab) {
                    this._tempNode = instantiate(prefab);
                    // 应用材质配置到所有子节点
                    YJLoadAssets.setMaterialInfoUuidToSubNode(this._tempNode, this.materialInfoUuid);
                    this.loaded = true;
                    resolve(instantiate(this._tempNode));
                } else {
                    resolve(null);
                }
            });
        }).catch(e => {
            no.err('YJLoadPrefab loadPrefab', this.node.name, e.message);
            return null;
        });
    }

    /** 
     * 重置加载状态
     * @remarks 用于需要重新加载预制体的场景
     * @example
     * // 重新加载资源：
     * loader.clear();
     * const newPrefab = await loader.loadPrefab();
     */
    public clear(): void {
        this._tempNode?.destroy();
        this.loaded = false;
    }
}
