
import { EDITOR, ccclass, property, executeInEditMode, instantiate, PageView, Node } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { HackUi } from './HackUi';
import { SetCreateNode } from './SetCreateNode';
import { YJJobManager } from '../base/YJJobManager';

/**
 * Predefined variables
 * Name = SetPage
 * DateTime = Mon Jan 17 2022 12:00:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPage.ts
 * FileBasenameNoExtension = SetPage
 * URL = db://assets/Script/common/ui/SetPage.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPage')
@executeInEditMode()
/**
 * 分页管理器
 * 功能：
 * 1. 根据数据动态创建/删除页面
 * 2. 支持异步加载资源和预制体
 * 示例用法：
 * onDataChange([
 *   {id:1},          // 创建新页面
 *   2,               // 删除索引为2的页面
 *   {id:3}           // 创建另一个新页面
 * ]);
 */
export class SetPage extends HackUi {

    @property({ type: YJLoadPrefab, displayName: '页面', tooltip: '需要挂载SetCreateNode组件' })
    page: YJLoadPrefab = null;

    @property(PageView)
    view: PageView = null;

    // 缓存预制体实例用于快速克隆
    private tempNode: Node;

    /**
     * 数据变更处理入口
     * @param data 支持两种操作类型：
     * - 对象：创建新页面
     * - 数字：删除指定索引页面
     * @example 
     * // 创建3个页面后删除第2个
     * onDataChange([{a:1}, {b:2}, {c:3}, 1]); 
     */
    protected async onDataChange(data: any) {
        data = [].concat(data); // 确保数据为数组
        if (data.length == 0) {
            this._clear();
        } else {
            // 预加载预制体模板
            if (!this.tempNode) this.tempNode = await this.page.loadPrefab();
            this.setPages(data);
        }
    }

    /**
     * 批量处理页面操作
     * @param data 操作队列，使用任务管理器分帧处理
     */
    private setPages(data: any[]) {
        const num = data.length;
        let i = 0;
        YJJobManager.ins.addTask(() => {
            const d = data[i++];
            // 根据数据类型执行不同操作
            if (d instanceof Object) {
                this.setPage(d); // 创建页面
            } else if (typeof d == 'number') {
                this._remove(d); // 删除页面
            }
            return i >= num; // 是否完成所有任务
        });
    }

    /**
     * 创建单个页面
     * @param data 页面数据对象
     * @example
     * setPage({ title: "新页面", content: "..." });
     */
    private async setPage(data: any) {
        let node = instantiate(this.tempNode);
        // 异步加载依赖资源
        await node.getComponent(YJLoadAssets)?.load();
        if (!this?.node?.isValid) return; // 组件有效性检查
        
        this.view.addPage(node);
        // 查找目标组件并设置数据（支持在子节点查找）
        const setter = node.getComponent(SetCreateNode) || node.getComponentInChildren(SetCreateNode);
        setter?.a_setData(data);
    }

    /// 页面删除操作 ///
    private _remove(index: number) {
        this.view?.removePageAtIndex(index);
    }

    /// 清空所有页面 ///
    private _clear() {
        this.view?.removeAllPages();
    }

    ////////////////// 编辑器专用方法 ////////////////
    onLoad() {
        super.onLoad();
        if (!EDITOR) return;

        // 编辑器模式下自动获取组件引用
        if (!this.page) this.page = this.getComponent(YJLoadPrefab);
        if (!this.view) this.view = this.getComponent(PageView);
    }
}
