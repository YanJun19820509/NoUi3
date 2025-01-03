
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
export class YJCreateNode extends Component {
    @property({ type: YJLoadPrefab })
    loadPrefab: YJLoadPrefab = null;
    @property({ type: Node })
    tempNode: Node = null;

    @property({ type: Node })
    target: Node = null;

    @property
    autoCreate: boolean = false;

    private _recycleType: string;

    start() {
        if (EDITOR) return;
        this.autoCreate && this.a_create();
    }

    public a_create() {
        this.createNode();
    }

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
    onLoad() {
        if (!EDITOR) return;
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.target) this.target = this.node;
    }
}