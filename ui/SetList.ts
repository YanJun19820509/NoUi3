
import { ccclass, property, menu, executeInEditMode, EDITOR, Node, instantiate, ScrollView, Size, UITransform, Layout, size, isValid, v3 } from '../yj';
import YJLoadPrefab from '../base/node/YJLoadPrefab';
import { YJDataWork } from '../base/YJDataWork';
import { YJJobManager } from '../base/YJJobManager';
import { no } from '../no';
import { HackUi } from './HackUi';
import { SetCreateNode } from './SetCreateNode';
import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';

/**
 * Predefined variables
 * Name = SetList
 * DateTime = Mon Jan 17 2022 10:55:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetList.ts
 * FileBasenameNoExtension = SetList
 * URL = db://assets/Script/common/ui/SetList.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetList')
@menu('NoUi/ui/SetList(设置列表:array)')
@executeInEditMode()
/**
 * 列表数据设置组件
 * 
 * 功能说明：
 * - 动态设置列表数据，并根据数据更新UI布局
 * - 支持多种数据格式，包括数组、对象等
 * - 提供丰富的配置选项，包括列数、元素模板、回调等
 * 
 */
export class SetList extends HackUi {

    // ================== 核心配置属性 ==================
    @property({ type: YJLoadPrefab, displayName: '元素容器', tooltip: '管理列表子项布局的容器，需要挂载SetCreateNode组件' })
    itemPanel: YJLoadPrefab = null;
    /**
     * @example
     * // 在场景编辑器中拖拽预制体节点到该属性
     * // 该预制体应包含SetCreateNode组件用于布局控制
     */

    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;
    /**
     * @example
     * // 设置列表项的预制体模板
     * // 注意：实际使用时模板节点应设为隐藏状态
     */

    // ================== 布局控制属性 ==================
    @property({ displayName: '列数', step: 1, min: 1 })
    columnNumber: number = 1;
    /**
     * @example
     * // 当需要网格布局时设置，例如：
     * // - 1: 纵向列表
     * // - 3: 三列网格
     */

    // ================== 性能优化属性 ==================
    @property({ displayName: '第一次逐个创建', tooltip: '逐个创建能提高性能，如果没有特殊需求，不要取消' })
    isFirst = true;
    /**
     * @example
     * // 设置为true时：
     * // 初始化时逐个创建子项，减少瞬时性能消耗
     * // 设置为false时：
     * // 一次性创建所有可见项，适用于简单列表
     */

    // ================== 动画与回调 ==================
    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;
    /**
     * @example
     * // 配置入场动画效果，如：
     * // - 渐入动画
     * // - 滑动效果
     */

    @property({ type: no.EventHandlerInfo, displayName: '创建完成回调' })
    onComplete: no.EventHandlerInfo[] = [];
    /**
     * @example
     * // 添加回调示例：
     * // this.onComplete.push(new no.EventHandlerInfo(targetNode, 'ScriptName', 'callbackMethod'))
     */

    // ================== 滚动视图相关 ==================
    @property(ScrollView)
    scrollView: ScrollView = null;
    @property(Node)
    content: Node = null;
    @property({ displayName: 'content扩展' })
    offset: Size = size();
    /**
     * @example
     * // 当需要额外滚动空间时设置：
     * // width: 横向扩展量
     * // height: 纵向扩展量
     */

    // ================== 数据控制属性 ==================
    @property({ displayName: '数据更新时自动回滚到第1个' })
    autoScrollBack: boolean = false;
    /**
     * @example
     * // 适用于分页加载数据场景
     * // 设置为true时更新数据后自动回到列表顶部
     */

    // ================== 生命周期控制 ==================
    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = true;
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;
    /**
     * @example
     * // 典型应用场景：
     * // 当列表需要频繁显隐时，开启可优化内存使用
     */

    // ================== 编辑器工具属性 ==================
    @property({ displayName: '设置元素模板相关数据' })
    public get setTemplateInfo(): boolean { return false; }
    public set setTemplateInfo(v: boolean) { this.preInitItems(); }
    /**
     * @example
     * // 在编辑器中点击该按钮可预计算：
     * // - 元素尺寸
     * // - 最大显示数量
     */

    // ================== 运行时状态属性 ==================
    @property({ displayName: '所需元素节点个数', readonly: true })
    showMax: number = 0; // 根据可视区域计算的动态值
    @property({ visible() { return false; } })
    itemSize: Size = size(); // 通过preInitItems计算的元素实际尺寸

    // ================== 私有运行时状态 ==================
    private listData: any[]; // 当前列表数据（支持数组/对象）
    private isVertical: boolean; // 滚动方向缓存
    private contentSize: number; // 主轴方向尺寸（横向=宽，纵向=高）
    private showNum: number;    // 可视区域最大显示数量
    private allNum: number;     // 总数据量
    private lastIndex: number = 0; // 最后元素位置（横向=x，纵向=y）
    private _loaded: boolean = false; // 资源加载完成标记
    private _isSettingData: boolean = false; // 数据设置锁
    private scrollViewContent: Node; // 滚动视图内容节点缓存
    private _1b1: boolean = false; // 布局计算标记

    /**
     * 组件加载生命周期回调
     * @功能说明
     * - 初始化预制体加载组件
     * - 仅在编辑器环境下执行初始化
     * @示例
     * // 在编辑器模式下自动获取YJLoadPrefab组件
     * onLoad() -> 获取itemPanel组件
     */
    async onLoad() {
        super.onLoad();
        // 编辑器环境下初始化预制体加载组件
        if (EDITOR) {
            if (!this.itemPanel) this.itemPanel = this.getComponent(YJLoadPrefab);
            return;
        }
    }

    /**
     * 组件启用生命周期回调
     * @功能说明
     * - 当clearOnDisable和recreateOnEnable同时启用时，重新创建子节点
     * @示例
     * // 当组件重新启用时，如果配置了清除并重建，则重置数据
     * onEnable() -> 调用resetData()
     */
    onEnable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        // 满足条件时重置数据重建子节点
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.resetData();
        }
    }

    /**
     * 组件禁用生命周期回调
     * @功能说明
     * - 清除数据引用
     * - 根据配置清理所有子节点
     * @示例
     * // 禁用组件时：
     * // 如果配置了clearOnDisable，销毁所有子节点
     * onDisable() -> 清理数据和子节点
     */
    onDisable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        // 根据配置执行子节点清理
        if (this.clearOnDisable) {
            this.clearItems();
        }
    }

    /**
     * 初始化列表模板
     * @流程说明
     * 1. 加载预制体模板
     * 2. 预计算元素尺寸和显示数量
     * 3. 初始化滚动视图配置
     * 4. 注册滚动事件监听
     * @示例
     * // 首次加载时：
     * // 1. 从itemPanel加载预制体
     * // 2. 计算itemSize和showMax
     * // 3. 绑定滚动事件回调
     */
    private async initTemplate() {
        if (this._loaded) return;
        this._loaded = true;
        
        // 加载预制体模板
        if (!this.template) {
            this.template = await this.itemPanel.loadPrefab();
            if (!this?.node?.isValid) return;
            this.preInitItems(); // 预计算元素尺寸
        }
        
        // 计算最大显示数量
        if (this.showMax == 0)
            this.preInitItems();
        
        // 初始化滚动方向配置
        this.isVertical = this.scrollView.vertical;
        
        // 获取内容节点引用
        if (!this.content)
            this.content = this.scrollView.content;
        this.scrollViewContent = this.scrollView.content;
        
        // 注册滚动事件监听
        this.scrollView.node.on(ScrollView.EventType.SCROLLING, () => {
            this.updatePos(); // 滚动时更新元素位置
        }, this);
    }

    /**
     * 清空所有列表元素
     * @功能说明
     * - 重置滚动位置到原点
     * - 销毁所有子节点
     * @示例
     * // 清理列表时：
     * // 1. 重置content位置到(0,0)
     * // 2. 遍历销毁所有子节点
     * clearItems() -> 清理列表内容
     */
    public clearItems() {
        this.content?.setPosition(0, 0);
        // 使用标准for循环遍历子节点
        for (let i = 0; i < this.content?.children.length; i++) {
            this.content.children[i].destroy();
        }
    }

    /**
     * 组件销毁生命周期回调
     * @功能说明
     * - 安全销毁预制体模板
     * @示例
     * // 组件销毁时：
     * // 如果模板有效则销毁
     * onDestroy() -> 模板资源清理
     */
    onDestroy() {
        if (EDITOR) return;
        // 安全销毁模板资源
        if (this.template && this.template.isValid)
            this.template.destroy();
    }

    /**
     * 处理列表数据变更
     * @param data 列表数据，支持数组或类数组结构
     * @流程说明
     * 1. 数据预处理：确保数据为数组格式
     * 2. 空数据检查：如果数据为空则触发完成回调
     * 3. 初始化模板：加载列表项预制体
     * 4. 多列布局处理：当列数大于1时将数据转换为二维数组
     * 5. 滚动位置重置：根据配置决定是否回到滚动起点
     * 6. 列表项初始化：根据数据量初始化容器尺寸
     * 7. 数据更新：设置最终列表数据并触发界面更新
     * 
     * @示例
     * // 基本数据格式
     * onDataChange([{id:1}, {id:2}]) -> 创建2个列表项
     * 
     * // 多列布局示例（columnNumber=3）
     * onDataChange([1,2,3,4,5]) -> 转换为[[1,2,3], [4,5]]
     */
    protected async onDataChange(data: any) {
        // 将输入数据转换为标准数组（支持类数组对象）
        let a = [].concat(data);
        
        // 空数据情况处理
        if (a.length == 0) {
            no.EventHandlerInfo.execute(this.onComplete);
            return;
        }

        // 标记数据更新状态防止重复操作
        this._isSettingData = true;
        
        // 取消所有延迟任务确保更新顺序
        this.unscheduleAllCallbacks();
        
        // 初始化列表项模板（异步加载预制体）
        await this.initTemplate();
        if (!this?.node?.isValid) return;

        // 获取当前所有列表项
        let listItems = this.content.children;

        // 处理多列布局（将一维数组转换为二维数组）
        if (this.columnNumber > 1) {
            a = no.arrayToArrays(a, this.columnNumber);
        }

        // 自动回滚到列表起始位置
        if (this.autoScrollBack && listItems.length > 0) {
            this.lastIndex = 0;
            no.position(this.scrollViewContent, v3(0, 0));
            // 使用标准for循环重置所有项位置
            for (let i = 0, n = listItems.length; i < n; i++) {
                let item = listItems[i];
                this.setItemPosition(item, i);
            }
        }

        // 初始化列表容器尺寸（当数据量变化时）
        if (this.allNum != a.length) {
            this.allNum = a.length;
            this.showNum = Math.min(this.showMax, this.allNum);
            this.initItems();
        }

        // 更新列表数据并触发界面刷新
        this.listData = a;
        this.setList();
    }

    /**
     * 初始化列表容器尺寸
     * @功能说明
     * - 根据滚动方向计算内容区域总尺寸
     * - 设置内容容器UITransform的宽高
     * - 纵向滚动时：高度=元素数量*元素高度 + 偏移量，宽度固定为元素宽度
     * - 横向滚动时：宽度=元素数量*元素宽度 + 偏移量，高度固定为元素高度
     * @示例
     * // 纵向布局示例：
     * // 元素高度100px，10个元素，垂直偏移50px
     * // => 总高度 = 10*100 + 50 = 1050
     * 
     * // 横向布局示例：
     * // 元素宽度200px，5个元素，水平偏移30px 
     * // => 总宽度 = 5*200 + 30 = 1030
     */
    private initItems() {
        // 验证节点有效性
        if (!this.node.isValid) return;
        // 检查元素尺寸是否已计算
        if (!this.itemSize) return;

        // 根据滚动方向计算内容尺寸
        if (this.isVertical) {
            // 纵向布局：高度=元素数量*元素高度 + 垂直偏移
            this.contentSize = this.allNum * this.itemSize.height + this.offset.height;
            this.content.getComponent(UITransform).width = this.itemSize.width;
            this.content.getComponent(UITransform).height = this.contentSize;
        } else {
            // 横向布局：宽度=元素数量*元素宽度 + 水平偏移
            this.contentSize = this.allNum * this.itemSize.width + this.offset.width;
            this.content.getComponent(UITransform).width = this.contentSize;
            this.content.getComponent(UITransform).height = this.itemSize.height;
        }
    }

    /**
     * 更新列表数据并刷新界面
     * @流程说明
     * 1. 按数据索引排序子节点
     * 2. 根据动画配置选择更新策略：
     *    - 启用动画时：使用定时器逐个更新（间隔0.1秒）
     *    - 普通模式时：使用任务管理器批量更新
     * 3. 执行完成回调
     * 4. 释放数据更新锁
     * @示例
     * // 动画模式：
     * // 每0.1秒更新一个元素，共更新showNum个元素
     * 
     * // 普通模式：
     * // 通过YJJobManager分帧处理，避免卡顿
     */
    private setList() {
        // 按数据索引排序子节点
        no.sortArray(this.content.children, (a, b) => a['__dataIndex'] - b['__dataIndex']);

        // 动画模式或强制更新模式
        if (this.uiAnim?.enabled || this._1b1) {
            this._1b1 = false; // 重置强制更新标记
            let i = 0;
            // 使用定时器逐个更新（支持动画效果）
            this.schedule(() => this.setItem(i++), 0.1, this.showNum - 1);
        } 
        // 普通模式
        else {
            let i = 0;
            // 使用任务管理器分帧处理
            YJJobManager.ins.addTask(() => {
                this.setItem(i++);
                return i >= this.showNum; // 终止条件
            });
        }

        // 安全校验节点状态
        if (!this?.node?.isValid) return;
        
        // 执行完成回调
        no.EventHandlerInfo.execute(this.onComplete);
        // 释放数据更新锁
        this._isSettingData = false;
    }

    /**
     * 设置列表项数据及显示状态
     * @流程说明
     * 1. 获取或创建列表项容器节点
     * 2. 设置数据索引并绑定数据
     * 3. 控制可见性及播放动画效果
     * @示例
     * // 当i=0时：
     * // - 创建新节点并设置初始位置
     * // - 绑定第0条数据
     * // - 播放缩放动画（如果是首次创建）
     */
    private setItem(i: number) {
        // 获取当前索引对应的列表项
        let item = this.content.children[i];
        let isNew = false;
        
        // 如果节点不存在则创建新节点
        if (!item) {
            // 实例化模板节点并设置基础属性
            const node = instantiate(this.template);
            no.position(node, v3(0, 0));  // 重置位置
            
            // 创建容器节点并配置尺寸
            const box = no.newNode('box');
            no.size(box, this.itemSize);  // 设置容器尺寸
            
            // 同步锚点配置
            const a = no.anchor(node);
            no.anchor(box, a.x, a.y);  // 保持与模板相同的锚点
            
            // 构建节点层级
            box.addChild(node);  // 将模板节点放入容器
            box.parent = this.content;  // 挂载到滚动容器
            
            // 初始化位置并标记为新节点
            this.setItemPosition(box, i);
            item = box;
            isNew = true;
        }

        // 绑定数据（当数据存在时）
        const data_idx = item['__dataIndex'];
        if (this.listData[data_idx]) {
            this.setItemData(item, this.listData[data_idx]);
        }

        // 控制可见性（当索引超出总数时隐藏）
        no.visible(item.children[0], i < this.allNum);

        // 动画处理逻辑
        if (this.uiAnim?.enabled) {
            // 播放预设动画
            this.uiAnim.playOtherNode(item.children[0]);
        } else if (this.isFirst && isNew) {
            // 首次创建时播放默认缩放动画
            no.TweenSet.play(no.parseTweenData([
                {
                    set: 1,
                    props: { scale: [0, 0] }  // 初始状态：完全缩小
                }, {
                    duration: .1,
                    to: 1,
                    props: { scale: [1, 1] }  // 动画终点：正常尺寸
                }
            ], item.children[0]));
        }
    }

    /**
     * 绑定数据到列表项组件
     * @流程说明
     * 1. 优先尝试使用YJDataWork组件
     * 2. 备选使用SetCreateNode组件
     * @示例
     * // 当item包含YJDataWork组件时：
     * // 调用initWithData(data)初始化数据
     * 
     * // 当item包含SetCreateNode组件时：
     * // 调用a_setData(data)方法设置数据
     */
    private setItemData(item: Node, data = []) {
        // 尝试获取YJDataWork组件
        let dataWork = item.children[0].getComponent(YJDataWork);
        if (dataWork) {
            dataWork.initWithData(data);
        }
        else {
            // 备选获取SetCreateNode组件
            let setNode = item.children[0].getComponent(SetCreateNode);
            if (setNode)
                setNode.a_setData(data);
        }
    }

    /**
     * 计算并设置列表项位置
     * @计算公式说明
     * 垂直布局：
     * y = -(索引 + 1 - 锚点Y) * 项高度 + 容器高度 * (1 - 容器锚点Y)
     * 
     * 水平布局：
     * x = (索引 + 锚点X) * 项宽度 - 容器宽度 * 容器锚点X
     * @示例
     * // 垂直布局，索引=0，项高度=100：
     * // y = -(0 + 1 - 0.5)*100 + 500*(1-0) = -50 + 500 = 450
     * 
     * // 水平布局，索引=0，项宽度=200：
     * // x = (0 + 0.5)*200 - 1000*0 = 100
     */
    private setItemPosition(item: Node, index: number) {
        item['__dataIndex'] = index;  // 存储数据索引
        let p = item.getPosition();
        let itemAnchor = item.getComponent(UITransform).anchorPoint;
        let contentSize = this.content.getComponent(UITransform).getBoundingBox().size;

        if (this.isVertical) {
            // 垂直滚动布局计算
            p.y = -(index + 1 - itemAnchor.y) * this.itemSize.height 
                 + contentSize.height * (1 - no.anchorY(this.content));
        } else {
            // 水平滚动布局计算
            p.x = (index + itemAnchor.x) * this.itemSize.width 
                 - contentSize.width * no.anchorX(this.content);
        }
        item.setPosition(p);
    }

    /**
     * 每帧更新处理（仅在编辑器模式下生效）
     * @功能说明
     * - 在编辑器环境下自动移除Layout组件
     * - 避免预制体节点的布局计算影响编辑器操作
     * @示例
     * // 当组件挂载Layout组件时：
     * // 在编辑模式下会自动销毁该组件
     */
    update() {
        if (EDITOR) {
            this.getComponent(Layout)?.destroy();
            return;
        }
    }

    /**
     * 动态更新列表项位置
     * @流程说明
     * 1. 校验节点有效性
     * 2. 获取当前滚动位置
     * 3. 计算可见区域起始索引
     * 4. 处理滚动边界情况
     * 5. 根据滚动方向更新元素数据和位置
     * @示例
     * // 垂直滚动列表，item高度=100，当前滚动位置y=250：
     * // startIndex = floor(250 / 100) = 2
     * // 当向上滚动超过阈值时，复用底部元素到顶部
     */
    private updatePos() {
        // 校验节点有效性
        if (!isValid(this?.node)) return;
        // 获取当前所有列表项
        const listItems = this.content.children;
        // 数据或元素为空时直接返回
        if (this.listData == null || listItems == null || listItems.length == 0) return;

        // 计算当前滚动位置和起始索引
        let curPos = 0;
        let startIndex = 0;
        if (this.isVertical) {
            curPos = no.y(this.scrollViewContent); // 获取垂直方向滚动位置
            startIndex = no.floor(curPos / this.itemSize.height); // 计算起始项索引
        } else {
            curPos = no.x(this.scrollViewContent); // 获取水平方向滚动位置
            startIndex = no.floor(-curPos / this.itemSize.width); // 计算起始项索引（水平滚动需取反）
        }

        // 处理滚动边界情况
        // 垂直滚动到顶部 或 水平滚动到最左
        if (this.lastIndex == 0 && startIndex <= this.lastIndex) return;
        // 垂直滚动到底部 或 水平滚动到最右（计算可显示的最大索引）
        if (this.lastIndex == this.allNum - (this.showNum - 2) && startIndex >= this.lastIndex) return;

        // 计算滚动方向差异
        const diff = startIndex - this.lastIndex;
        if (diff !== 0) {
            this.lastIndex = startIndex; // 更新最后已知索引
            const n = listItems.length; // 当前存在的列表项数量
            
            // 使用标准for循环遍历所有列表项
            for (let i = 0; i < n; i++) {
                const item = listItems[i];
                const dataIndex = item['__dataIndex']; // 获取元素关联的数据索引
                
                if (diff < 0) { // 向下/向右滚动
                    // 检查元素是否超出可见范围且可以循环到顶部/左侧
                    if (dataIndex - startIndex > this.showNum - 1 && dataIndex - n >= 0) {
                        // 示例：当向下滚动时，将底部元素移动到顶部并更新数据
                        this.setItemData(item, this.listData[dataIndex - n]);
                        this.setItemPosition(item, dataIndex - n);
                    }
                } else if (diff > 0) { // 向上/向左滚动
                    // 检查元素是否超出可见范围且可以循环到底部/右侧
                    if (dataIndex < startIndex && dataIndex + n < this.allNum) {
                        // 示例：当向上滚动时，将顶部元素移动到底部并更新数据
                        this.setItemData(item, this.listData[dataIndex + n]);
                        this.setItemPosition(item, dataIndex + n);
                    }
                }
            }
        }
    }

    /**
     * 预初始化列表项参数
     * @功能说明
     * 1. 校验必要组件
     * 2. 计算元素尺寸
     * 3. 确定滚动方向
     * 4. 计算最大显示数量
     * @示例
     * // 垂直布局，可视区域高度=500，元素高度=100：
     * // showMax = ceil(500/100) + 1 = 5 + 1 = 6
     * // 表示需要预创建6个元素保证滚动流畅
     */
    private preInitItems() {
        // 校验必要组件
        if (!this.scrollView || !this.template) {
            console.error('scrollView 或 template 为 null!');
            return;
        }

        // 计算模板元素实际尺寸
        this.itemSize = this.template.getComponent(UITransform).getBoundingBox().size;
        // 获取滚动视图可视区域尺寸
        const viewSize = this.scrollView.node.getComponent(UITransform).getBoundingBox().size;
        // 确定滚动方向
        this.isVertical = this.scrollView.vertical;

        // 计算可视区域最大显示数量
        let showMax: number;
        if (this.isVertical) {
            showMax = no.ceil(viewSize.height / this.itemSize.height); // 垂直方向计算行数
        } else {
            showMax = no.ceil(viewSize.width / this.itemSize.width); // 水平方向计算列数
        }
        this.showMax = showMax + 1; // 增加缓冲项
    }
}
