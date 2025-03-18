
import { ccclass, property, menu, executeInEditMode, Component, Node, instantiate, EDITOR } from '../yj';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import YJLoadPrefab from './node/YJLoadPrefab';
import { YJCacheObject } from './YJCacheObject';
import { YJDataWork } from './YJDataWork';

/**
 * Predefined variables
 * Name = YJCreateNode
 * DateTime = Fri Jan 14 2022 17:53:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCreateNode.ts
 * FileBasenameNoExtension = YJCreateNode
 * URL = db://assets/Script/NoUi3/base/YJCreateNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJCreateNode')
@menu('NoUi/base/YJCreateNode(创建节点)')
@executeInEditMode()
/**
 * 节点创建组件
 * @description 提供节点创建和对象池复用功能，支持预制体加载和模板节点实例化
 * @example
 * // 编辑器配置示例：
 * // - LoadPrefab: 配置预制体加载组件
 * // - TempNode: 设置模板节点（优先于预制体加载）
 * // - Target: 设置新节点的父节点
 * // - AutoCreate: 勾选后会在游戏启动时自动创建
 * 
 * @example
 * // 代码调用示例：
 * const creator = this.getComponent(YJCreateNode);
 * const newNode = await creator.createNode();
 * newNode.setPosition(100, 50);
 */
export class YJCreateNode extends Component {
    /** 预制体加载组件（用于异步加载预制体） */
    @property({ type: YJLoadPrefab })
    loadPrefab: YJLoadPrefab = null;
    
    /** 模板节点（优先使用，直接实例化） */
    @property({ type: Node })
    tempNode: Node = null;

    /** 新节点父级目标 */
    @property({ type: Node })
    target: Node = null;

    /** 是否自动创建 */
    @property
    autoCreate: boolean = false;

    /** 缓存回收类型（从YJCacheObject组件获取） */
    private _recycleType: string;

    /**
     * 生命周期方法：处理自动创建逻辑
     * @remarks 在编辑器模式下不执行
     */
    start() {
        if (EDITOR) return;
        this.autoCreate && this.a_create();
    }

    /**
     * 公开的创建入口方法
     * @example
     * // 通过按钮事件触发创建
     * button.node.on('click', () => this.getComponent(YJCreateNode).a_create());
     */
    public a_create() {
        this.createNode();
    }

    /**
     * 核心创建方法
     * @returns 新创建的节点Promise
     * @remarks 创建流程：
     * 1. 优先从对象池获取可用节点
     * 2. 使用模板节点实例化或加载预制体
     * 3. 异步加载依赖资源
     * 4. 初始化数据组件
     * 5. 缓存回收类型
     * 6. 设置节点层级和可见性
     * 
     * @example
     * // 创建并配置节点
     * const node = await this.createNode();
     * node.getComponent(YJCacheObject).recycleType = 'bullet';
     */
    public async createNode(): Promise<Node> {
        // 1. 优先从对象池获取
        if (this._recycleType) {
            const recycledNode: Node = no.cachePool.reuse(this._recycleType);
            if (recycledNode) {
                recycledNode.parent = this.target;
                no.visible(recycledNode, true);
                return recycledNode;
            }
        }

        // 2. 使用缓存的临时节点或加载预制体
        try {
            let node: Node;
            if (this.tempNode) {
                node = instantiate(this.tempNode);
            } else {
                node = await this.loadPrefab.loadPrefab();
            }

            // 检查组件是否有效
            if (!this?.node?.isValid) return null;
            if (!node) return null;

            // 3. 异步加载资源
            const loadAssetsComp = node.getComponent(YJLoadAssets);
            if (loadAssetsComp) {
                await loadAssetsComp.load();
                if (!this?.node?.isValid) return null;
            }

            // 4. 初始化数据
            const dataWorkComp = node.getComponent(YJDataWork);
            dataWorkComp?.init();

            // 5. 缓存回收类型
            const cacheObjComp = node.getComponent(YJCacheObject);
            if (cacheObjComp) {
                this._recycleType = cacheObjComp.recycleType;
            }

            // 6. 设置父节点和显示状态
            node.parent = this.target;
            no.visible(node, true);
            return node;

        } catch (error) {
            console.error('[YJCreateNode] Failed to create node:', error);
            return null;
        }
    }

    ///////////////////////////EDITOR///////////////
    /**
     * 编辑器模式初始化
     * @remarks 自动获取必要组件引用
     */
    onLoad() {
        if (!EDITOR) return;
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.target) this.target = this.node;
    }
}