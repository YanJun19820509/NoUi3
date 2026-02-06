import { EDITOR, Node, ScrollView, Size, Vec2, ccclass, instantiate, isValid, property, size } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { HackUi } from './HackUi';
import { SetCreateNode } from './SetCreateNode';


const templateTypeKey = '_template_type_';

@ccclass('SetMultipleListInfo')
/**
 * 多模板列表配置信息
 * @功能说明
 * - 管理不同模板类型的配置参数
 * - 提供模板实例化功能
 * - 计算并存储模板尺寸信息
 * @示例
 * // 配置横向图标列表模板：
 * { 
 *   type: 'icon_item',
 *   template: iconTemplateNode,
 *   showMax: 5  // 可见区域最多显示5个图标
 * }
 * 
 * // 配置纵向新闻条目模板：
 * {
 *   type: 'news_item',
 *   template: newsTemplateNode,
 *   showMax: 8  // 列表高度可容纳8条新闻
 * }
 */
export class SetMultipleListInfo {
    @property({ displayName: '模板类型标识', tooltip: '用于数据与模板匹配的关键字' })
    type: string = '';
    @property({ type: Node, displayName: '元素模板', tooltip: '预制体节点引用' })
    template: Node = null;
    @property({
        displayName: '所需元素节点个数',
        tooltip: '根据滚动视图尺寸计算的显示上限'
    })
    showMax: number = 0;
    @property({ visible() { return false; } })
    itemSize: Size = size();

    /**
     * 初始化模板实例
     * @param parent 父节点容器
     * @returns 生成的节点数组
     * @流程说明
     * 1. 循环创建指定数量的模板实例
     * 2. 为每个实例添加模板类型标识
     * 3. 设置数据索引用于后续数据绑定
     * 4. 建立父子节点关系
     * @示例
     * // 初始化3个对话气泡模板：
     * const chatNodes = info.initTemplate(chatContentNode);
     * // 返回的节点数组可用于后续数据填充：
     * chatNodes[0].getComponent(SetCreateNode).a_setData({text: "你好"}); 
     */
    public initTemplate(parent: Node): Node[] {
        let nodes: Node[] = [];
        // 使用while循环避免使用for...of
        let i = 0;
        while (i < this.showMax) {
            // 实例化预制体模板
            const instance = instantiate(this.template);
            // 标记实例类型用于数据匹配
            instance[templateTypeKey] = this.type;
            // 设置数据索引用于后续更新
            instance['__dataIndex'] = i;
            // 设置父节点
            instance.parent = parent;
            // 加入返回数组
            nodes.push(instance);
            i++;
        }
        return nodes;
    }
}

@ccclass('SetMultipleList')
/**
 * 多模板动态列表
 * Author mqsy_yj
 * DateTime Wed Jan 24 2024 12:18:29 GMT+0800 (中国标准时间)
 * 
 */
export class SetMultipleList extends HackUi {
    @property({ type: SetMultipleListInfo })
    templates: SetMultipleListInfo[] = [];
    /**
     * 多模板配置数组
     * @example
     * // 配置两种不同样式的列表项模板：
     * [
     *   { template: chatItemPrefab, type: 'text' }, // 文本类型模板
     *   { template: imageItemPrefab, type: 'image' } // 图片类型模板
     * ]
     */

    @property({ type: no.EventHandlerInfo, displayName: '创建完成回调' })
    onComplete: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '滚动时回调' })
    onScrolling: no.EventHandlerInfo[] = [];

    @property(ScrollView)
    scrollView: ScrollView = null;
    @property(Node)
    content: Node = null;
    @property({ displayName: 'content扩展' })
    offset: Size = size();
    /**
     * 内容区域扩展尺寸
     * @example
     * // 当需要显示部分下一个元素时：
     * // 设置offset.width = 50 可以让滚动视图右侧多留50像素空间
     */

    @property({ displayName: '数据更新时自动回滚到第1个' })
    autoScrollBack: boolean = false;
    /**
     * @example
     * // 当有新数据加载时：
     * // 设置为true会自动滚动到列表顶部
     * // 适用于聊天记录刷新等场景
     */

    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = true;
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;

    @property({ displayName: '设置元素模板相关数据' })
    public get setTemplateInfo(): boolean {
        return false;
    }

    public set setTemplateInfo(v: boolean) {
        /**
         * 自动计算模板显示数量
         * @流程说明
         * 1. 获取滚动视图可视区域尺寸
         * 2. 根据滚动方向计算每个模板的最大显示数量
         * 3. 更新模板配置的itemSize和showMax属性
         * @示例
         * // 垂直滚动视图高度500px，模板高度100px：
         * // showMax = 500 / 100 = 5（向上取整）
         * // 水平滚动视图宽度1200px，模板宽度200px：
         * // showMax = 1200 / 200 = 6
         */
        if (!this.scrollView) {
            console.error('scrollView 为 null!');
            return;
        }
        let viewSize = no.size(this.scrollView.view.node);
        let isVertical = this.scrollView.vertical;

        let t: SetMultipleListInfo;
        // 使用传统for循环替代for...of
        if (isVertical) {
            for (let i = 0, n = this.templates.length; i < n; i++) {
                t = this.templates[i];
                if (t.template) {
                    t.itemSize = no.size(t.template);
                    t.showMax = no.ceil(viewSize.height / t.itemSize.height);
                }
            }
        } else {
            for (let i = 0, n = this.templates.length; i < n; i++) {
                t = this.templates[i];
                if (t.template) {
                    t.itemSize = no.size(t.template);
                    t.showMax = no.ceil(viewSize.width / t.itemSize.width);
                }
            }
        }
    }

    /**
     * 列表数据存储
     * @description 存储格式示例：
     * [
     *   { type: 'text', content: '消息1' },
     *   { type: 'image', url: 'image1.png' }
     * ]
     */
    private listData: any[];

    /**
     * 横向时指宽，纵向时指高
     * @example
     * // 垂直滚动时：
     * // contentSize 表示内容区域总高度
     * // 水平滚动时：
     * // contentSize 表示内容区域总宽度
     */
    private isVertical: boolean;
    private contentSize: number;

    /**
     * 实际最多可显示的itemPanel个数
     * @description 
     * - 考虑不同尺寸模板的混合排列
     * - 根据滚动视图尺寸和模板尺寸动态计算
     */
    private showNum: number;

    private allNum: number;
    /**
     * node最后的位置，横向时指x，纵向时指y
     * @description 
     * - 用于回收检测的边界值
     * - 根据滚动方向存储不同坐标值
     */
    private lastIndex: number = 0;

    private _loaded: boolean = false;
    private _isSettingData: boolean = false;
    private scrollViewContent: Node;
    private scrollViewSize: Size;

    /**
     * 模板尺寸映射表
     * @example
     * {
     *   'text': { size: cc.size(200,100),  showNum: 5 },
     *   'image': { size: cc.size(300,150),  showNum: 3 }
     * }
     */
    private templateMap: { [type: string]: { size: Size, showNum: number } };

    /**
     * 可用节点池
     * @description 按类型分类存储可复用节点
     * @example
     * {
     *   'text': [node1, node2, node3],
     *   'image': [node4, node5]
     * }
     */
    private itemsMap: { [type: string]: Node[] };

    /**
     * 位置索引映射表
     * @description 存储每个数据项的位置坐标
     * @example
     * // 垂直布局：
     * [0, 100, 200, 300,...] // 每个元素对应y坐标
     */
    private positionMap: number[] = [];

    /**
     * 类型数据索引映射
     * @description 记录各类型模板使用的数据索引
     * @example
     * {
     *   'text': [0, 2, 4], 
     *   'image': [1, 3]
     * }
     */
    private typeDataIndexMap: { [type: string]: number[] } = {};

    private _1b1: boolean = false;

    /**
     * 当组件启用时的回调
     * @功能说明
     * - 在编辑器模式下不执行
     * - 当组件重新激活且配置了清除后重建时，重置数据
     * @示例
     * // 当组件被再次激活时：
     * // 如果clearOnDisable和recreateOnEnable都为true
     * // 会执行resetData()重新初始化列表
     */
    onEnable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.resetData();
        }
    }

    /**
     * 当组件禁用时的回调
     * @功能说明
     * - 清除当前数据
     * - 根据配置清除所有子节点
     * @流程说明
     * 如果开启clearOnDisable则销毁所有子节点
     * @示例
     * // 当切换界面隐藏列表时：
     * // 会销毁所有列表项节点释放资源
     */
    onDisable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        if (this.clearOnDisable) {
            this.clearItems();
        }
    }

    /**
     * 清空所有列表项
     * @功能说明
     * - 重置加载状态和节点池
     * - 重置滚动位置
     * - 销毁所有子节点
     * @示例
     * // 清空聊天记录列表：
     * // component.clearItems()
     * // 会移除所有聊天气泡节点
     */
    public clearItems() {
        this._loaded = false;
        this.itemsMap = null;
        // 重置内容容器位置
        this.content?.setPosition(0, 0);
        this.lastIndex = 0;
        // 使用标准for循环遍历子节点
        for (let i = 0, n = this.content?.children.length; i < n; i++) {
            this.content.children[i].destroy();
        }
    }

    /**
     * 格式化数据添加模板类型标识
     * @param data 需要格式化的原始数据
     * @param templateType 模板类型标识符
     * @returns 添加了模板类型标识的数据
     * @示例
     * // 格式化聊天数据：
     * const chatData = SetMultipleList.format(
     *   {text: "你好"}, 
     *   'chat_bubble'
     * );
     * // chatData会包含_chat_bubble_类型标识
     */
    public static format(data: any, templateType: string) {
        data[templateTypeKey] = templateType;
        return data;
    }

    /**
     * 更新列表数据
     * @param d 新数据集
     * @功能说明
     * - 使用浅拷贝方式更新数据
     * - 仅更新数据，不触发列表重新渲染
     */
    public updateData(d: any) {
        this.listData = [].concat(d);
    }

    /**
     * 初始化多模板列表
     * @流程说明
     * 1. 判断滚动方向（垂直/水平）
     * 2. 设置内容容器锚点（垂直列表顶部对齐，水平列表左对齐）
     * 3. 获取滚动视图尺寸
     * 4. 初始化模板实例并建立映射关系
     * @示例
     * // 初始化包含聊天和图片的混排列表：
     * // - 垂直滚动模式
     * // - 创建5个聊天模板实例
     * // - 创建3个图片模板实例
     * // - 总显示容量为8个元素
     */
    private initTemplates() {
        if (this._loaded) return;
        // 确定滚动方向（true=垂直滚动，false=水平滚动）
        this.isVertical = this.scrollView.vertical;
        // 确保内容容器引用正确
        if (!this.content)
            this.content = this.scrollView.content;
        // 设置内容容器锚点（垂直列表顶部对齐，水平列表左对齐）
        if (this.isVertical) {
            no.anchorY(this.content, 1); // 垂直列表Y轴锚点置顶
        } else {
            no.anchorX(this.content, 0); // 水平列表X轴锚点置左
        }
        // 缓存滚动视图相关参数
        this.scrollViewContent = this.scrollView.content;
        this.scrollViewSize = no.size(this.scrollView.view.node);
        // 初始化模板容器
        this.templateMap = {};
        this.itemsMap = {};
        this.showNum = 0;
        let t: SetMultipleListInfo;
        // 遍历所有模板配置（使用标准for循环）
        for (let i = 0, n = this.templates.length; i < n; i++) {
            t = this.templates[i];
            this.showNum += t.showMax; // 累计总显示元素数量
            // 初始化模板实例并建立映射
            this.itemsMap[t.type] = t.initTemplate(this.content);
            // 存储模板元数据
            this.templateMap[t.type] = {
                size: t.itemSize,          // 模板尺寸
                showNum: t.showMax         // 最大显示数量
            };
        }
        this._loaded = true; // 标记初始化完成
    }

    /**
     * 计算并设置内容容器尺寸
     * @流程说明
     * 1. 移除旧滚动监听
     * 2. 遍历数据计算总内容尺寸
     * 3. 根据滚动方向设置容器尺寸
     * 4. 处理自动回滚逻辑
     * 5. 添加新滚动监听
     * @示例
     * // 垂直列表示例：
     * // - 3条聊天数据，每条高度100+10(offset)
     * // - 总高度计算为 3*(100+10) = 330
     * // - 容器高度设为330，宽度取最大元素宽度
     * 
     * // 水平列表示例：
     * // - 5个图标，每个宽度80+15(offset)
     * // - 总宽度计算为 5*(80+15) = 475
     * // - 容器宽度设为475，高度取最大元素高度
     */
    private setContentSize() {
        // 移除旧滚动事件监听
        this.scrollView.node.off(ScrollView.EventType.SCROLLING, () => {
            this.updatePos();
        }, this);

        // 初始化尺寸计算参数
        this.contentSize = 0;      // 内容总尺寸（垂直=高度，水平=宽度）
        let maxSize = 0;           // 最大交叉轴尺寸（垂直=宽度，水平=高度）
        this.positionMap.length = 0; // 元素位置映射表
        let lastItemSize = 0;      // 上一个元素尺寸（用于计算偏移）
        this.typeDataIndexMap = {}; // 数据类型索引映射

        let d: any;
        let templateType: string;
        let template: { size: Size, showNum: number };
        let _size: Size;
        // 遍历所有数据计算内容尺寸（使用标准for循环）
        for (let index = 0, n = this.listData.length; index < n; index++) {
            d = this.listData[index];
            templateType = d[templateTypeKey];
            // 建立类型-索引映射关系
            this.typeDataIndexMap[templateType] = this.typeDataIndexMap[templateType] || [];
            this.typeDataIndexMap[templateType][this.typeDataIndexMap[templateType].length] = index;

            if (templateType) {
                template = this.templateMap[templateType];
                _size = template.size;
                if (this.isVertical) {
                    // 垂直模式：累加高度，记录最大宽度
                    this.contentSize += _size.height + this.offset.height;
                    if (_size.width > maxSize) maxSize = _size.width;
                    // 计算元素Y轴位置（从上往下排列）
                    this.positionMap.push((this.positionMap[this.positionMap.length - 1] || 0) - lastItemSize - this.offset.height);
                    lastItemSize = _size.height;
                } else {
                    // 水平模式：累加宽度，记录最大高度
                    this.contentSize += _size.width + this.offset.width;
                    if (_size.height > maxSize) maxSize = _size.height;
                    // 计算元素X轴位置（从左往右排列）
                    this.positionMap.push((this.positionMap[this.positionMap.length - 1] || 0) + lastItemSize + this.offset.width);
                    lastItemSize = _size.width;
                }
            }
        }

        // 设置最终内容容器尺寸
        if (this.isVertical) {
            _size = size(maxSize, this.contentSize); // 垂直：宽=最大元素宽，高=总高
        } else {
            _size = size(this.contentSize, maxSize);  // 水平：宽=总宽，高=最大元素高
        }
        no.size(this.content, _size);

        // 处理内容容器位置
        let { x, y } = no.position(this.content);
        if (this.autoScrollBack) {
            // 自动回滚到起始位置
            x = 0;
            y = 0;
            this.content.setPosition(x, y);
            this.lastIndex = 0;
        } else {
            // 保持当前滚动位置（限制在合理范围内）
            if (this.isVertical) {
                y = Math.min(y, Math.max(0, _size.height - this.scrollViewSize.height));
            } else {
                x = Math.max(x, Math.min(0, this.scrollViewSize.width - _size.width));
            }
            this.content.setPosition(x, y);
        }

        // 添加新的滚动事件监听
        this.scrollView.node.on(ScrollView.EventType.SCROLLING, () => {
            this.updatePos();
        }, this);
    }

    /**
     * 数据更新处理方法
     * @param data 新数据集（示例：[{_t: 'item1', ...}, {_t: 'item2', ...}]）
     * @example
     * 当收到新数据时：
     * 1. 取消所有定时器
     * 2. 初始化模板（如果未初始化）
     * 3. 更新列表数据并重新计算布局
     * 4. 执行完成回调
     */
    protected onDataChange(data: any) {
        // 取消所有可能影响数据完整性的异步操作
        this.unscheduleAllCallbacks();

        // 节点有效性检查（防止组件已销毁的情况）
        if (!this?.node?.isValid) return;

        // 初始化模板系统（如果未初始化）
        this.initTemplates();

        // 再次检查节点和内容容器有效性
        if (!this?.node?.isValid || !this?.content?.isValid) return;

        let resetContentPos = false;
        if (!(data instanceof Array)) {
            if (data.start != null && data.data) {
                resetContentPos = true;
                this.lastIndex = data.start;
                data = data.data;
            }
        }
        if (!(data instanceof Array)) {
            data = [].concat(data);
        }
        //是否第1次
        this._1b1 = !!this.listData;
        // 创建数据副本以避免污染原始数据
        this.listData = data;      // 存储当前列表数据
        this.allNum = data.length; // 记录数据总量

        // 计算并设置内容容器尺寸
        this.setContentSize();
        if (resetContentPos) {
            let p = -this.positionMap[this.lastIndex];
            let maxOffset = this.scrollView.getMaxScrollOffset();
            if (this.isVertical) {
                p = Math.min(p, maxOffset.y);
                if (p == maxOffset.y) {
                    this.lastIndex = 0;
                } else {
                    this.scrollViewContent.setPosition(0, Math.min(-p, maxOffset.y));
                }
            } else {
                p = Math.max(p, maxOffset.x);
                if (p == maxOffset.x) {
                    this.lastIndex = 0;
                } else {
                    this.scrollViewContent.setPosition(Math.min(-p, maxOffset.x), 0);
                }
            }
            if (this.lastIndex > 0) {
                for (let type in this.itemsMap) {
                    let items = this.itemsMap[type];
                    for (let i = 0; i < items.length; i++) {
                        let item = items[i];
                        item['__dataIndex'] = -1;
                    }
                }
            }
        }
        // 更新列表项显示
        this.setList();

        // 最终有效性检查
        if (!this?.node?.isValid) return;

        // 重置数据设置状态
        this._isSettingData = false;
    }

    /**
     * 核心列表更新方法
     * @example
     * 工作流程：
     * 1. 遍历所有模板类型
     * 2. 对每个模板类型：
     *   - 如果没有对应数据索引：隐藏所有该类型元素
     *   - 如果有对应数据索引：批量更新可见元素
     * 3. 根据滚动位置优化显示元素
     */
    private setList() {
        if (!this.node.isValid) return;

        // 获取所有模板类型（示例：['character', 'item', 'skill']）
        const types = Object.keys(this.itemsMap);

        // 使用传统for循环遍历模板类型（避免for of）
        for (let typeIndex = 0, typeCount = types.length; typeIndex < typeCount; typeIndex++) {
            const type = types[typeIndex];
            const dataIndexes: number[] = this.typeDataIndexMap[type];

            // 当前类型没有对应数据的情况
            if (!dataIndexes) {
                const items = this.itemsMap[type];
                let item: Node;
                // 隐藏所有该类型元素并重置数据索引
                for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                    item = items[itemIndex];
                    no.visible(item, false);
                    item['__dataIndex'] = -1; // 使用数字类型-1表示未使用
                }
            } else {
                // 处理有数据的情况（优化显示范围）
                for (let i = 0, n = dataIndexes.length; i < n; i++) {
                    // 找到第一个>=lastIndex的索引作为起始点
                    if (dataIndexes[i] >= this.lastIndex) {
                        const items = this.itemsMap[type];
                        let j = 0;
                        while (j < items.length) {
                            this.setItem(items, dataIndexes, i, j++)
                        }
                        break; // 找到第一个有效区间后跳出循环
                    }
                }
            }
        }
        // 执行完成回调
        this.scheduleOnce(() => {
            no.EventHandlerInfo.execute(this.onComplete);
        }, 0.5);
    }

    private setItem(items: Node[], dataIndexes: number[], i: number, j: number) {
        const item = items[j];
        const dataIndex = dataIndexes[i + j];

        if (dataIndex != undefined) {
            // 有效数据索引时更新元素
            this.setItemData(item, this.listData[dataIndex]); // 示例：更新UI显示
            this.setItemPosition(item, dataIndex);           // 示例：设置位置
            no.visible(item, true);                          // 显示元素
        } else {
            // 超出数据范围时隐藏元素
            no.visible(item, false);
            item['__dataIndex'] = -1;
        }
    }

    /**
     * 根据滚动方向更新列表项显示
     * @param lastIndex 上次显示的起始索引
     * @param curIndex 当前需要显示的起始索引
     * @param asc 滚动方向 true=向上滚动 false=向下滚动
     * @流程说明
     * - 处理两种滚动情况：
     *   [asc=true] 向上滚动时复用下方元素显示上方内容
     *   [asc=false] 向下滚动时复用上方元素显示下方内容
     * - 通过数据索引映射找到对应模板元素
     * - 更新元素数据和位置实现循环复用
     * @示例
     * // 当用户快速向上滚动聊天列表时：
     * // setItemAt(0, 5, true) 复用前5个元素显示5-10条数据
     * // 元素会重新定位并更新为对应索引的数据
     */
    private setItemAt(lastIndex: number, curIndex: number, asc: boolean) {
        let d: any;
        let templateType: string;
        let showNum: number;
        let indexs: number[];
        let i: number;
        let items: Node[];
        let ni: number;
        let nIndex: number;
        let nItem: Node;
        let item: Node;
        let nd: any;
        if (asc) {
            // 处理向上滚动（加载后续数据）
            for (let index = lastIndex; index < curIndex; index++) {
                // 获取当前数据项的模板类型
                d = this.listData[index];
                if (!d) continue;
                templateType = d[templateTypeKey];
                // 获取该模板类型的配置参数
                showNum = this.templateMap[templateType].showNum; // 该类型最大显示数量
                indexs = this.typeDataIndexMap[templateType];    // 该类型数据索引数组
                i = indexs.indexOf(index);                       // 当前数据在类型数组中的位置
                items = this.itemsMap[templateType];             // 该类型所有节点实例

                // 计算需要更新的目标索引
                ni = i + showNum;                // 目标位置偏移量
                nIndex = indexs[ni];             // 实际目标数据索引
                nItem = no.itemOfArray(items, nIndex, '__dataIndex'); // 查找已绑定该索引的节点

                // 如果目标节点已存在则跳过
                if (nItem) continue;

                // 获取当前索引绑定的节点
                item = no.itemOfArray(items, index, '__dataIndex');
                if (!item) continue;

                // 更新节点数据和位置
                nd = this.listData[nIndex];
                if (nd) {
                    this.setItemData(item, nd);        // 绑定新数据
                    this.setItemPosition(item, nIndex);// 设置新位置
                    no.visible(item, true);            // 确保节点可见
                }
            }
        } else {
            // 处理向下滚动（加载先前数据）
            for (let index = lastIndex - 1; index >= curIndex; index--) {
                d = this.listData[index];
                if (!d) continue;
                templateType = d[templateTypeKey];
                showNum = this.templateMap[templateType].showNum;
                items = this.itemsMap[templateType];

                // 跳过已处理的节点
                if (no.itemOfArray(items, index, '__dataIndex')) continue;

                // 计算需要复用的节点索引
                indexs = this.typeDataIndexMap[templateType];
                ni = indexs.indexOf(index) + showNum; // 向后偏移showNum个位置
                nIndex = indexs[ni];
                if (nIndex == undefined) nIndex = -1;      // 处理越界情况

                // 获取可复用的节点
                item = no.itemOfArray(items, nIndex, '__dataIndex');
                if (!item) continue;

                // 更新节点为当前数据
                nd = this.listData[index];
                if (nd) {
                    this.setItemData(item, nd);
                    this.setItemPosition(item, index);
                    no.visible(item, true);
                }
            }
        }
    }

    /**
     * 设置列表项数据
     * @param item 需要更新的节点
     * @param data 要绑定的数据
     * @说明
     * - 支持两种数据绑定方式：
     *   1. 使用YJDataWork组件自动绑定
     *   2. 使用SetCreateNode手动设置
     * @示例
     * // 更新聊天项数据：
     * setItemData(chatNode, {text: "新消息", time: "12:00"})
     * // 会自动调用对应组件的初始化方法
     */
    private setItemData(item: Node, data = []) {
        // 优先使用YJDataWork组件进行数据绑定
        let b = item.getComponent(YJDataWork);
        if (b) {
            b.initWithData(data);
        }
        // 兼容SetCreateNode方式
        else {
            let a = item.getComponent(SetCreateNode);
            if (a)
                a.a_setData(data); // 手动设置数据
        }
    }

    /**
     * 设置列表项位置
     * @param item 需要定位的节点
     * @param index 数据索引
     * @说明
     * - 根据滚动方向使用不同坐标轴
     * - 垂直布局使用Y轴坐标，水平布局使用X轴坐标
     * @示例
     * // 垂直列表设置位置：
     * setItemPosition(item, 5) -> y=positionMap[5]
     * // 水平列表设置位置：
     * setItemPosition(item, 3) -> x=positionMap[3]
     */
    private setItemPosition(item: Node, index: number) {
        item['__dataIndex'] = index; // 更新节点绑定的数据索引
        // 根据滚动方向设置坐标
        if (this.isVertical) {
            // 垂直布局设置Y坐标
            no.y(item, this.positionMap[index])
        } else {
            // 水平布局设置X坐标
            no.x(item, this.positionMap[index])
        }
    }

    /**
     * 更新列表项显示位置
     * @功能说明
     * - 根据滚动位置计算当前可视区域起始索引
     * - 处理滚动事件回调
     * - 当滚动超过阈值时更新显示项
     * @示例
     * // 垂直列表滚动到第5项位置时：
     * // curPos = 滚动容器Y轴位置
     * // 通过positionMap找到第一个小于curPos的位置索引
     * // 触发setItemAt更新显示项
     */
    private updatePos() {
        // 有效性检查：确保节点未销毁
        if (!isValid(this?.node)) return;

        // 获取当前所有列表项节点
        let listItems = this.content.children;
        // 数据为空或没有列表项时直接返回
        if (this.listData == null || listItems == null || listItems.length == 0) return;

        let curPos = 0;      // 当前滚动位置
        let startIndex = 0;  // 可视区域起始索引

        // 根据滚动方向计算当前位置（转换为正数坐标系）
        if (this.isVertical) {
            // 垂直滚动：取Y轴负值（因为内容容器向下滚动时坐标为负）
            // 示例：当滚动到第3项时，curPos = 300（假设每项高100）
            curPos = -no.y(this.scrollViewContent);
        } else {
            // 水平滚动：取X轴负值（因为内容容器向右滚动时坐标为负）
            // 示例：当滚动到第2项时，curPos = 200（假设每项宽100）
            curPos = -no.x(this.scrollViewContent);
        }

        // 计算起始显示索引（当有滚动偏移时）
        if (curPos != 0) {
            // 遍历位置映射表找到第一个超过当前滚动位置的点
            // 示例：positionMap = [0,100,200,300], curPos=250 → 找到i=3(300>250) → startIndex=2
            for (let i = 0, n = this.positionMap.length; i < n; i++) {
                if (curPos > this.positionMap[i]) {
                    startIndex = i - 1;
                    break;
                }
            }
        }

        // 执行滚动事件回调（参数：当前滚动位置，滚动进度0-1）
        // 示例：curPos=250，contentSize=400 → 进度=250/400=0.625
        no.EventHandlerInfo.execute(this.onScrolling, curPos, -curPos / this.contentSize);

        // 起始索引有效性检查
        if (this.positionMap[startIndex] == null) return;

        // 计算滚动方向差异
        let diff = startIndex - this.lastIndex;
        if (diff != 0) {
            /**
             * 当滚动超过一个显示区块时：
             * @参数说明
             * - lastIndex: 上次记录的起始索引
             * - startIndex: 当前计算的起始索引
             * - diff>0表示向下/向右滚动，diff<0表示向上/向左滚动
             * @示例
             * 当从索引2滚动到索引5时：
             * diff=3 → 触发setItemAt(2,5,true) 更新显示项
             */
            this.setItemAt(this.lastIndex, startIndex, diff > 0);
            this.lastIndex = startIndex;
        }
    }
}
