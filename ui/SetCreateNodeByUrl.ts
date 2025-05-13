
import { ccclass, property, menu, executeInEditMode, EDITOR, Node, instantiate, Prefab, UITransform, math } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetCreateNodeByUrl
 * DateTime = Fri Mar 25 2022 15:10:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateNodeByUrl.ts
 * FileBasenameNoExtension = SetCreateNodeByUrl
 * URL = db://assets/common/ui/SetCreateNodeByUrl.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * 参数 : {
 *  url: string,
 *  data: array
 * }
 */
@ccclass('SetCreateNodeByUrl')
@menu('NoUi/ui/SetCreateNodeByUrl(根据prefab的url动态创建节点:object)')
@executeInEditMode()
/**
 * 根据prefab的url动态创建节点
 * @description 根据prefab的url动态创建节点，并根据数据更新节点内容
 * @example
 * // 在UI编辑器中配置：
 * // url: "prefab/Item"
 * // data: [{id:1}, {id:2}]
 */
export class SetCreateNodeByUrl extends HackUi {
    /**
     * 容器节点，用于存放动态创建的预制体实例
     * @example 如果未指定，默认使用当前节点作为容器
     */
    @property({ type: Node, displayName: '容器' })
    container: Node = null;
    
    /**
     * 是否根据第一个子节点的大小自动调整容器尺寸
     * @规则 仅当子节点数量为1时生效
     */
    @property({ tooltip: '根据子节点大小重置宽高，当子节点个数大于1时不生效' })
    resize: boolean = false;
    
    /**
     * 组件禁用时是否清空所有子节点
     * @适用场景 需要频繁切换显示/隐藏时建议开启
     */
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = false;

    // 当前加载的预制体URL
    private url: string;
    // 需要销毁的子节点UUID列表
    private needDestroyChildrenUuid: string[] = [];
    // 组件是否已销毁标志
    private isDestroied: boolean = false;
    // 缓存的预制体资源
    private prefab: Prefab;

    /**
     * 组件禁用时回调
     * @功能 1.清空数据 2.根据配置清空子节点
     */
    onDisable() {
        if (this.clearOnDisable) {
            this.clear(true);
        }
    }

    /**
     * 组件销毁时回调
     * @重要操作 设置销毁标志防止无效操作
     */
    onDestroy() {
        this.isDestroied = true;
    }

    /**
     * 数据变更处理
     * @param d 输入数据 {url:string, data:any[]}
     * @流程 1.加载新预制体 2.创建/更新子节点 3.清理旧节点
     * @示例 {url:"prefab/Item", data:[{id:1}, {id:2}]}
     */
    protected onDataChange(d: any) {
        let { url, data }: { url: string, data: any[] } = d;
        if (url && this.url != url) {
            this.url = url;
            // 异步加载预制体资源
            no.assetBundleManager.loadPrefab(url, item => {
                if (!this?.node?.isValid) return;
                // 单个子节点时调整容器尺寸
                if (data.length == 1) this.resizeContentSize(item.data);
                this.prefab = item;
                // 标记需要销毁的旧节点
                this.setNeedDestroyChildren();
                // 创建新节点后清理旧节点
                this.setItems(data).then(() => {
                    this.clear();
                }).catch(e => no.err('createnodebyurl', e.message));
            });
        } else {
            // 复用已有预制体更新数据
            this.setItems(data);
        }
    }

    /**
     * 创建/更新子节点
     * @param data 子节点数据数组
     * @流程 1.创建不足的节点 2.更新已有节点数据
     * @注意 使用传统for循环保证执行顺序
     */
    private async setItems(data: any[]) {
        if (!this.prefab) return;
        if (!this.container) this.container = this.node;
        if (!this.container?.isValid || this.isDestroied) return;

        const n = data.length;
        const l = this.container.children.length - this.needDestroyChildrenUuid.length;

        // 创建新增节点
        if (l < n) {
            for (let i = l; i < n; i++) {
                const item = instantiate(this.prefab);
                // 加载节点依赖资源
                if (item.getComponent(YJLoadAssets)) {
                    await item.getComponent(YJLoadAssets).load();
                    if (!this?.node?.isValid) return;
                }
                item.active = true;
                
                // 设置节点数据
                const dataWork = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                if (dataWork) {
                    dataWork.data = data[i];
                }
                item.parent = this.container;
            }
        }

        // 更新现有节点
        for (let i = 0; i < l; i++) {
            const item = this.container.children[i];
            if (data[i] == null) {
                no.visible(item, false);
            } else {
                no.visible(item, true);
                const dataWork = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
                if (dataWork) {
                    dataWork.data = data[i];
                    dataWork.init();
                }
            }
        }
    }

    /**
     * 调整容器尺寸
     * @param child 参考节点
     * @算法 容器尺寸 = 子节点原始尺寸 × 缩放比例
     */
    private resizeContentSize(child: Node) {
        if (!this.resize) return;
        const scale = child.scale;
        const size = child.getComponent(UITransform).contentSize.clone();
        size.width *= scale.x;
        size.height *= scale.y;
        this.container.getComponent(UITransform).contentSize = size;
    }

    /**
     * 清理子节点
     * @param all 是否清理所有子节点
     * @策略 根据UUID列表选择性销毁
     */
    private clear(all = false) {
        for (let i = 0; i < this.container?.children.length; i++) {
            const child = this.container.children[i];
            if (all || this.needDestroyChildrenUuid.indexOf(child.uuid) != -1) {
                child.destroy();
            }
        }
        if (!this.isValid) return;
        this.needDestroyChildrenUuid?.splice(0);
    }

    /**
     * 标记需要销毁的旧节点
     * @实现 记录现有子节点UUID并隐藏
     */
    private setNeedDestroyChildren() {
        this.needDestroyChildrenUuid?.splice(0);
        for (let i = 0; i < this.container?.children.length; i++) {
            const child = this.container.children[i];
            this.needDestroyChildrenUuid.push(child.uuid);
            no.visible(child, false);
        }
    }

    /////////////////////////// 编辑器专用逻辑 ///////////////////////////
    /**
     * 编辑器加载时初始化
     * @注意 只在编辑器环境下执行
     */
    onLoad() {
        this.isDestroied = false;
        super.onLoad();
        if (!EDITOR) return;
        if (!this.container) this.container = this.node;
    }
}
