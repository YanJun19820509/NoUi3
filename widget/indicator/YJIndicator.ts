
import { ccclass, property, Node, instantiate, Toggle, Layout } from '../../yj';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJIndicator
 * DateTime = Tue Nov 29 2022 12:24:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJIndicator.ts
 * FileBasenameNoExtension = YJIndicator
 * URL = db://assets/common/widget/indicator/YJIndicator.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 导航标签
 * data:{num?: number, cur?: number}
 * num是标签总数，cur当前高亮下标
 */
@ccclass('YJIndicator')
/**
 * 导航指示器组件
 * @example
 * // 编辑器配置示例：
 * // 1. 将标签预制体拖拽到Template属性
 * // 2. 将容器节点拖拽到Container属性
 * // 3. 勾选autoSpace自动计算间距
 * // 4. 通过dataWork组件传入数据：{num:5, cur:0} 表示5个标签，当前选中第0个
 * 
 * // 代码调用示例：
 * // 获取组件引用
 * const indicator = this.node.getComponent(YJIndicator);
 * // 通过数据驱动更新状态
 * indicator.data = { num: 3, cur: 1 };
 * indicator.a_updateData();
 */
export class YJIndicator extends YJDataWork {
    /** 
     * 标签模板节点 
     * @description 需要拖入预制体节点，用于实例化每个指示点
     * @example 包含Toggle组件的预制体节点
     */
    @property({ type: Node, displayName: '标签模板' })
    template: Node = null;

    /** 
     * 容器节点 
     * @description 用于存放生成的标签节点，建议使用Layout组件控制布局
     * @example 带有HorizontalLayout组件的ScrollContent节点
     */
    @property({ type: Node, displayName: '容器' })
    container: Node = null;

    /** 
     * 自动计算间距 
     * @description 启用后根据容器宽度和标签数量自动计算间距
     * @example 当容器宽度300，需要显示3个标签时，自动计算左右边距和间距
     */
    @property({ displayName: '自动间距' })
    autoSpace: boolean = false;

    /**
     * 数据初始化后处理
     * @override 重写父类方法
     * @description 根据数据创建标签并设置当前选中状态
     * 数据格式：{num: 标签总数, cur: 当前选中索引}
     */
    protected afterDataInit() {
        if (!this.template || !this.container) return;
        let { num, cur }: { num?: number, cur?: number } = this.data;
        if (num != undefined) this.createItem(num);
        if (cur != undefined) this.setCur(cur);
    }

    /**
     * 创建标签项
     * @param n 需要创建的标签数量
     * @description 根据模板实例化节点，自动处理布局间距
     * 当autoSpace为true时，计算公式：(容器宽度 - 单个标签宽度 * 数量) / (数量 + 1)
     */
    private createItem(n: number) {
        // 自动间距计算逻辑
        if (this.autoSpace) {
            const layout = this.container.getComponent(Layout);
            if (layout) {
                const width = no.width(this.container),
                    tw = no.width(this.template),
                    spaceX = (width - tw * n) / (n + 1);
                layout.paddingLeft = spaceX;
                layout.spacingX = spaceX;
            }
        }

        // 动态创建标签节点
        let l = this.container.children.length;
        let c: Node;
        for (let i = l; i < n; i++) {
            c = instantiate(this.template);
            c.parent = this.container;
            c.active = true; // 激活实例化的节点
        }
    }

    /**
     * 设置当前选中状态
     * @param idx 当前选中项的索引
     * @description 遍历所有标签节点，通过Toggle组件控制选中状态
     * 要求模板节点必须包含Toggle组件
     */
    private setCur(idx: number) {
        let arr = this.container.children;
        for (let i = 0, n = arr.length; i < n; i++) {
            arr[i].getComponent(Toggle).isChecked = i == idx;
        }
    }
}
