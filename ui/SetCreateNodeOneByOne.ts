
import { ccclass, property, Component, Node, instantiate } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { SetCreateNode } from './SetCreateNode';
import { SetCreateNodeOneByOneDelegate } from './SetCreateNodeOneByOneDelegate';

/**
 * Predefined variables
 * Name = setCreateNodeOneByOne
 * DateTime = Wed Jun 22 2022 16:05:07 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = setCreateNodeOneByOne.ts
 * FileBasenameNoExtension = setCreateNodeOneByOne
 * URL = db://assets/common/ui/setCreateNodeOneByOne.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetCreateNodeOneByOne')
/**
 * 逐个创建并显示节点的组件
 * @特点 
 * - 支持按指定时间间隔逐个显示节点
 * - 提供创建前后的生命周期回调
 * - 自动处理节点复用和资源加载
 * 
 * @示例 创建3个节点，每个间隔1秒：
 * const data = [{id:1}, {id:2}, {id:3}];
 * this.setItems(data);
 */
export class SetCreateNodeOneByOne extends SetCreateNode {
    @property({ displayName: '间隔时长(s)', min: 0 })
    duration: number = 1;
    
    @property(SetCreateNodeOneByOneDelegate)
    delegate: SetCreateNodeOneByOneDelegate = null;

    /**
     * 设置并显示数据项
     * @param data 要显示的数据数组
     * @流程说明
     * 1. 容器节点检查/自动设置
     * 2. 单元素特殊处理
     * 3. 预制体加载
     * 4. 隐藏现有节点
     * 5. 动态创建缺失节点
     * 6. 启动逐个显示流程
     */
    protected async setItems(data: any[]) {
        // 确保容器存在，默认使用当前节点
        if (!this.container) this.container = this.node;

        // 单元素优化处理：直接使用动态图集节点方式
        if (this.onlyOne) {
            this.setDynamicAtlasNode(data[0]);
            return;
        }
        
        // 异步加载预制体模板
        if (!this.template) {
            this.template = await this.loadPrefab.loadPrefab();
            if (!this?.node?.isValid) return;
        }

        // 隐藏所有现有子节点（使用传统for循环）
        const l = this.container.children.length;
        for (let i = 0; i < l; i++) {
            no.visible(this.container.children[i], false);
        }

        // 动态创建缺失的节点实例
        const n = data.length;
        if (l < n) {
            for (let i = l; i < n; i++) {
                const item = instantiate(this.template);
                item.active = true; // 确保节点可渲染
                no.visible(item, false); // 初始隐藏
                item.parent = this.container; // 挂载到容器
            }
        }

        // 启动逐个显示流程（当有有效数据时）
        if (n > 0) {
            this.showItemsOneByOne(data, 0);
        }
    }

    /**
     * 递归显示节点的方法
     * @param data 数据数组
     * @param idx 当前要处理的索引
     * @流程说明
     * 1. 检查节点有效性
     * 2. 触发创建前回调
     * 3. 数据绑定和节点显示
     * 4. 触发创建后回调
     * 5. 等待指定间隔
     * 6. 递归处理下一个
     * 
     * @示例 当data为[obj1, obj2, obj3]时：
     * - 第0秒显示obj1
     * - 第1秒显示obj2
     * - 第2秒显示obj3
     */
    private async showItemsOneByOne(data: any[], idx: number) {
        const item = this.container.children[idx];
        
        // 终止条件：节点无效或数据为空
        if (!item || data[idx] == null) {
            this.delegate?.afterAllCreated();
            return;
        }

        // 生命周期回调：创建前处理
        this.delegate?.beforeCreateOneNode(idx, data[idx]);
        if (!this?.node?.isValid) return;

        // 数据绑定到YJDataWork组件
        const dataWork = item.getComponent(YJDataWork) || item.getComponentInChildren(YJDataWork);
        no.visible(item, !!data[idx]); // 控制可见性
        if (dataWork && data[idx]) {
            dataWork.data = data[idx]; // 注入数据
            dataWork.init(); // 初始化绑定
        }

        // 生命周期回调：创建后处理
        this.delegate?.afterCreateOneNode(idx, data[idx], item);
        if (!this?.node?.isValid) return;

        // 等待指定间隔后处理下一个
        await no.sleep(this.duration, this);
        this.showItemsOneByOne(data, idx + 1);
    }
}
