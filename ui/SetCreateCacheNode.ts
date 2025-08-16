
import { ccclass, menu, property, executeInEditMode, EDITOR, Node, instantiate, isValid } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetCreateCacheNode
 * DateTime = Tue Apr 19 2022 10:17:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateCacheNode.ts
 * FileBasenameNoExtension = SetCreateCacheNode
 * URL = db://assets/NoUi3/ui/SetCreateCacheNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetCreateCacheNode')
@menu('NoUi/ui/SetCreateCacheNode(动态创建可回收节点:object|array)')
@executeInEditMode()
/**
 * 动态创建可回收节点组件
 * 
 * @功能说明
 * - 根据输入数据动态生成节点实例
 * - 支持节点回收复用机制，通过缓存池管理节点生命周期
 * - 自动绑定数据到子节点的YJDataWork组件
 * - 支持编辑器实时预览
 * 
 * @使用示例
 * // 创建单个节点
 * a_setData({id:1001}); 
 * 
 * // 批量创建节点
 * a_setData([{id:1001}, {id:1002}, {id:1003}]);
 * 
 * // 编辑器配置步骤：
 * 1. 拖入元素预制体或设置元素模板节点
 * 2. 指定容器节点（默认为当前节点）
 * 3. 确保模板节点挂载YJCacheObject组件定义回收类型
 * 4. 节点需包含YJDataWork组件用于数据绑定
 */
export class SetCreateCacheNode extends HackUi {
    // 预制体加载组件（优先使用template时可不设置）
    @property({ type: YJLoadPrefab, displayName: '元素预制体' })
    loadPrefab: YJLoadPrefab = null;

    // 元素模板节点（优先使用预制体时可不设置）
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;

    // 节点生成容器（默认为当前节点）
    @property({ type: Node, displayName: '容器' })
    container: Node = null;

    @property({ type: String, displayName: '缓存池回收类型' })
    recycleType: string;

    /**
     * 组件销毁时清理资源
     * - 销毁动态创建的模板节点
     * - 清空对应类型的缓存池
     */
    onDestroy() {
        if (this.loadPrefab && this.template && this.template.isValid)
            this.template.destroy();
        no.nodePool.clearByType(this.recycleType);
    }

    /**
     * 数据变化处理入口
     * @param data 节点数据，支持对象或数组格式
     * @example
     * // 创建3个节点
     * onDataChange([{name:'A'}, {name:'B'}, {name:'C'}]);
     * 
     * // 更新单个节点数据
     * onDataChange({score:100});
     */
    protected onDataChange(data: any) {
        this.setItems([].concat(data));
    }

    /**
     * 异步初始化并创建节点
     * @param data 节点数据数组
     * @实现流程
     * 1. 加载预制体（如果未设置模板节点）
     * 2. 加载依赖资源（如果模板有YJLoadAssets组件）
     * 3. 初始化缓存池类型
     * 4. 开始逐个创建节点
     */
    private async setItems(data: any[]) {
        if (!this.template) {
            // 动态加载预制体作为模板
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
            // 加载模板依赖资源
            await this.template.getComponent(YJLoadAssets)?.load();
            if (!this?.node?.isValid) return;
        }
        if (!this.container) this.container = this.node;

        this.setItem(data, 0);
    }

    /**
     * 递归创建节点项
     * @param data 数据数组
     * @param i 当前处理索引
     * @实现说明
     * - 优先从缓存池复用节点
     * - 新建节点需要等待一帧确保组件初始化
     * - 自动绑定数据到YJDataWork组件
     * - 支持跳过空数据项
     */
    private setItem(data: any[], i: number) {
        if (i >= data.length) return;
        if (!data[i]) {
            this.setItem(data, ++i);
            return;
        };
        // 尝试从缓存池获取节点
        let item = no.nodePool.get(this.recycleType), needWait = false;
        if (!item || !isValid(item)) {
            // 实例化新节点并标记需要等待初始化
            item = instantiate(this.template);
            item.active = true;
            needWait = true;
        }
        item.parent = this.container;
        // 绑定数据到YJDataWork组件
        let a = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        if (a) {
            a.clear().initWithData(data[i]);
        }
        no.visible(item, true);
        // 新建节点需要等待一帧继续创建（防止卡顿）
        if (needWait) this.scheduleOnce(() => {
            this.setItem(data, ++i);
        });
        else this.setItem(data, ++i);
    }

    ///////////////////////////EDITOR///////////////
    /**
     * 编辑器初始化
     * - 自动获取YJLoadPrefab组件
     * - 设置默认容器为当前节点
     */
    onLoad() {
        super.onLoad();
        if (!EDITOR) {
            return;
        }
        if (!this.loadPrefab) this.loadPrefab = this.getComponent(YJLoadPrefab);
        if (!this.container) this.container = this.node;
    }
}
