import { no } from "NoUi3/no";
import { ccclass, Node, EventTouch, property, v4, Vec3, Vec4, v3, Vec2, v2 } from "NoUi3/yj";
import { Range } from "NoUi3/types";
import { YJTouchListener } from "../touch/YJTouchListener";
import { YJDragDropItemNode } from "./YJDragDropItemNode";
import { YJDragDropTargetNode } from "./YJDragDropTargetNode";
import { YJFitScreen } from "../YJFitScreen";
/**
 * 拖拽管理器，需要将可拖拽的节点和拖拽放入的目标节点都作为该节点的子节点
 * Author mqsy_yj
 * DateTime Sun Sep 29 2024 10:45:52 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJDragDropManager')
export class YJDragDropManager extends YJTouchListener {
    /** 
     * 是否开启拖拽功能 
     * @example
     * // 在场景中临时禁用所有拖拽操作
     * this.getComponent(YJDragDropManager).dragDrop = false;
     */
    @property({ displayName: '是否开启拖拽' })
    dragDrop: boolean = true;

    /** 
     * 是否返回原点（当释放时未到达有效目标时生效）
     * @remarks 适用于需要精确放置的场景，如拼图游戏、物品栏系统
     * @example
     * // 启用后未成功放置的卡牌会自动回到手牌区
     */
    @property({ displayName: '是否返回原点', tooltip: '选中后，当释放时，未到达拖放目标位置或未设置拖放目标时返回初始位置', visible() { return this.dragDrop; } })
    canBack: boolean = false;

    /** 
     * 接近目标时触发的事件（携带两个参数：拖拽节点、目标节点）
     * @example
     * // 当接近目标时播放提示音效
     * onApproachTarget: [{
     *   target: soundManager,
     *   component: "AudioPlayer",
     *   handler: "play",
     *   customEventData: "approach_sound"
     * }]
     */
    @property({ type: no.EventHandlerInfo, displayName: '接近目标时', visible() { return this.dragDrop; } })
    onApproachTarget: no.EventHandlerInfo[] = [];

    /** 
     * 离开已接近目标时触发的事件（参数同上）
     * @example
     * // 离开目标时显示红色警示框
     */
    @property({ type: no.EventHandlerInfo, displayName: '离开目标时', tooltip: '当已接近目标后又离开时触发', visible() { return this.dragDrop; } })
    onAwayFromTarget: no.EventHandlerInfo[] = [];

    /** 
     * 成功放入目标时触发的事件（参数同上）
     * @example
     * // 放入时更新背包数据
     */
    @property({ type: no.EventHandlerInfo, displayName: '放入目标时', visible() { return this.dragDrop; } })
    onAchieveTarget: no.EventHandlerInfo[] = [];

    /** 
     * 点击事件（非拖拽操作时触发）
     * @example
     * // 点击卡牌时显示详细信息
     */
    @property({ type: no.EventHandlerInfo, displayName: '点击时' })
    onClick: no.EventHandlerInfo[] = [];

    /** 
     * 是否在拖拽时修改节点层级 
     * @remarks 适用于需要确保拖拽元素始终在最顶层的场景
     * @example
     * // 防止拖拽的卡牌被其他UI元素遮挡
     */
    @property({ displayName: '设置拖动节点的父节点为本节点', tooltip: '开启后，拖动时，拖动节点将作为本节点的子节点', visible() { return this.dragDrop; } })
    changeParent: boolean = false;

    /** 
     * 水平移动开关（与moveY组合可实现不同方向的限制）
     * @example
     * // 设置为true,false可实现只能水平拖动
     */
    @property({ displayName: '开启左右拖动', visible() { return this.dragDrop; } })
    moveX: boolean = true;

    /** 
     * 垂直移动开关 
     * @example
     * // 设置为false,true可实现只能垂直拖动
     */
    @property({ displayName: '开启上下拖动', visible() { return this.dragDrop; } })
    moveY: boolean = true;

    /** 
     * 是否启用自定义拖拽范围限制 
     * @see range 具体范围参数
     */
    @property({ displayName: '开启拖动范围限制', visible() { return this.dragDrop; } })
    isRange: boolean = false;

    /** 
     * 拖拽范围约束（Vec4格式：x_min, y_min, x_max, y_max）
     * @remarks 当值为(0,0,0,0)时会自动计算为屏幕可见区域
     * @example
     * // 限制在屏幕中央 200x200 区域
     * range: v4(-100, -100, 100, 100)
     */
    @property({ displayName: '拖动范围', tooltip: '开启拖动范围限制后，如果范围为默认值，将会根据屏幕宽高和拖动节点尺寸自动计算', visible() { return this.dragDrop && this.isRange; } })
    range: Vec4 = v4();

    /** 
     * 水平翻转开关（常用于角色方向控制）
     * @example
     * // 拖动角色到左侧时自动面朝左边
     */
    @property({ displayName: '开启左右翻转', tooltip: '拖动到指定x坐标时进行左右翻转', visible() { return this.dragDrop; } })
    isTurnX: boolean = false;

    /** 
     * 水平翻转阈值范围（当节点x坐标小于min时scaleX=-1，大于max时scaleX=1）
     * @remarks 中间区域保持当前状态
     */
    @property({ type: Range, displayName: '左右翻转点x', tooltip: '拖动时x小于该值scaleX为-1，否则为1', visible() { return this.isTurnX; } })
    xTurnPos: Range = Range.new();

    /** 
     * 垂直翻转开关（特殊场景使用，如倒置元素）
     */
    @property({ displayName: '开启上下翻转', tooltip: '拖动到指定y坐标时进行上下翻转', visible() { return this.dragDrop; } })
    isTurnY: boolean = false;

    /** 
     * 垂直翻转阈值范围（逻辑同xTurnPos）
     */
    @property({ type: Range, displayName: '上下翻转点y', tooltip: '拖动时x小于该值scaleY为-1，否则为1', visible() { return this.isTurnY; } })
    yTurnPos: Range = Range.new();

    // 运行时状态管理
    /** 上次成功拖拽的节点（用于连续操作记录） */
    protected lastDragNode: Node = null;
    /** 当前被拖拽的节点引用 */
    protected dragNode: Node = null;
    /** 当前悬停的目标节点 */
    protected dropTarget: Node = null;
    /** 接近状态标记（用于触发approach/away事件） */
    private _isApproached: boolean = false;

    /**
     * 触摸开始回调
     * @param event 触摸事件
     * @returns 是否处理成功
     * @example
     * // 初始化拖拽节点并设置拖拽范围
     * onStart(event) {
     *     // 自动继承父类触摸处理
     *     // 重置当前拖拽节点和放置目标
     *     // 如果拖拽功能未启用则直接返回
     *     // 通过触摸位置获取可拖拽节点
     *     // 如果节点允许拖拽则：
     *     // 1. 更新拖拽范围（根据屏幕尺寸或自定义范围）
     *     // 2. 必要时改变节点父级（用于处理UI层级问题）
     *     // 3. 触发拖拽项的开始回调（如记录初始位置/显示拖拽效果）
     */
    public onStart(event: EventTouch) {
        super.onStart(event);
        this.dragNode = null;
        this.dropTarget = null;
        if (!this.dragDrop) return false;
        this.setDragNode(event);

        if (this.dragNode) {
            const ddn = this.dragNode.getComponent(YJDragDropItemNode);
            if (ddn.canDrag()) {
                this.updateRange(); // 计算有效拖拽区域
                if (this.changeParent)
                    this.dragNode.parent = this.node; // 示例：将拖拽项移至画布根节点
            }
            ddn.onStart(event) // 触发拖拽项自定义开始逻辑
        }
        return true;
    }

    /**
     * 触摸移动回调
     * @param event 触摸事件
     * @returns 是否处理成功
     * @example
     * // 处理拖拽移动逻辑
     * onMove(event) {
     *     // 自动继承父类触摸处理
     *     // 如果拖拽功能未启用则直接返回
     *     // 更新拖拽节点位置（考虑范围限制）
     *     // 触发拖拽项的移动回调（如实时更新位置/旋转效果）
     *     // 检测目标区域进入/离开状态：
     *     // - 当首次进入有效区域时触发onApproachTarget
     *     // - 当离开有效区域时触发onAwayFromTarget
     *     // 示例：拖拽角色接近宝箱时高亮宝箱，离开时取消高亮
     */
    public onMove(event: EventTouch) {
        super.onMove(event);
        if (!this.dragDrop) return false;

        if (this.dragNode) {
            const ddn = this.dragNode.getComponent(YJDragDropItemNode);
            if (ddn.canDrag())
                this.setPosition(this.dragNode, event.getUIDelta()); // 使用增量移动保证流畅性
            this.dragNode.getComponent(YJDragDropItemNode).onMove(event);
        }

        // 处理目标区域接近/离开事件
        if (this.onApproachTarget.length > 0 || this.onAwayFromTarget.length > 0) {
            this.dropTarget = null;
            this.setDropTarget(event); // 通过射线检测查找有效目标

            if (this.dropTarget) {
                if (!this._isApproached) {
                    this._isApproached = true;
                    no.EventHandlerInfo.execute(this.onApproachTarget, this.dragNode, this.dropTarget); // 示例：播放音效/粒子效果
                }
            } else if (this._isApproached) {
                this._isApproached = false;
                no.EventHandlerInfo.execute(this.onAwayFromTarget, this.dragNode, this.dropTarget); // 示例：恢复目标外观
            }
        }
        return true;
    }

    /**
     * 触摸结束回调
     * @param event 触摸事件对象
     * @returns 是否处理成功
     * @example
     * // 处理拖拽结束逻辑：
     * // 1. 当拖拽功能未启用时触发点击事件（如按钮点击）
     * // 2. 检测最终放置目标：
     * //   - 如果存在有效目标：触发拖拽项结束回调，执行放置成功事件（如更新数据/播放音效）
     * //   - 如果无有效目标：根据canBack设置决定是否返回初始位置
     * // 示例：将装备拖拽到槽位时更新角色属性，未放入时返回背包
     */
    public onEnd(event: EventTouch) {
        super.onEnd(event);
        // 处理纯点击操作（非拖拽情况）
        if (!this.dragDrop) {
            no.EventHandlerInfo.execute(this.onClick, this.dragNode); // 示例：触发按钮点击音效/打开面板
            return true;
        }

        // 最终确认放置目标（防止移动过程中未检测到）
        if (!this.dropTarget) {
            this.setDropTarget(event); // 通过射线检测最终目标
        }

        // 处理放置结果
        if (this.dropTarget) {
            if (this.dragNode) {
                this.dragNode.getComponent(YJDragDropItemNode).onEnd(event); // 触发拖拽项自定义结束逻辑
                no.EventHandlerInfo.execute(this.onAchieveTarget, this.dragNode, this.dropTarget); // 示例：播放"放置成功"音效/更新数据
            }
        } else {
            this.moveBack(event); // 无目标时返回初始位置
        }
        return true;
    }

    /**
     * 触摸取消回调（如被系统中断）
     * @param event 触摸事件对象
     * @returns 是否处理成功
     * @example
     * // 处理中断逻辑：
     * // 1. 如果已放置到目标：仍视为成功放置
     * // 2. 如果未放置到目标：按canBack设置处理
     * // 示例：来电中断拖拽时，若已在目标区域则保留，否则返回原位
     */
    public onCancel(event: EventTouch) {
        super.onCancel(event);
        if (!this.dragDrop) return false;

        // 检测最后时刻的放置目标
        if (!this.dropTarget) {
            this.setDropTarget(event); // 最终确认目标状态
        }

        // 统一按正常结束流程处理
        if (this.dropTarget) {
            if (this.dragNode) {
                this.dragNode.getComponent(YJDragDropItemNode).onEnd(event); // 触发拖拽项结束逻辑
                no.EventHandlerInfo.execute(this.onAchieveTarget, this.dragNode, this.dropTarget); // 示例：保存进度
            }
        } else {
            this.moveBack(event); // 示例：播放"取消操作"音效
        }
        return true;
    }

    /**
     * 返回原点（带缓动动画）
     * @param event 触摸事件
     * @example
     * // 当canBack为true时触发返回动画：
     * // 1. 播放位移渐变动画
     * // 2. 重置节点旋转角度
     * // 3. 触发onMoveBack回调（可用于播放音效/粒子效果）
     * // 示例：拼图游戏取消拖拽时，播放"咻"的音效并平滑返回
     */
    protected moveBack(event: EventTouch) {
        if (!this.canBack || !this.dragNode) return;
        this.dragNode.getComponent(YJDragDropItemNode).onMoveBack(event);
    }

    /**
     * 设置节点位置（带边界检测和方向翻转）
     * @param node 目标节点
     * @param deltaPos 位置偏移量（基于触摸移动量计算）
     * @example
     * // 处理逻辑：
     * // 1. 根据moveX/moveY决定是否处理对应轴向移动
     * // 2. 应用层级缩放系数修正位置
     * // 3. 当isRange开启时限制在矩形范围内
     * // 4. 根据xTurnPos/yTurnPos自动翻转节点scale
     * // 示例：滑动拼图块时限制在棋盘范围内，超过中线自动翻转方向
     */
    protected setPosition(node: Node, deltaPos: Vec2) {
        if (!node) return;
        const scale1 = no.scaleInHierarchy(node); // 获取节点在层级中的累积缩放
        let pos = no.position(node);
        // 应用轴向移动限制和缩放修正
        pos.add3f(
            this.moveX ? (deltaPos.x / scale1.x) : 0, 
            this.moveY ? (deltaPos.y / scale1.y) : 0, 
            0
        );

        // 边界约束（range存储为Vec4: x-min, y-min, x-max, y-max）
        if (this.isRange) {
            pos.x = Math.max(this.range.x, Math.min(pos.x, this.range.z));
            pos.y = Math.max(this.range.y, Math.min(pos.y, this.range.w));
        }

        no.position(node, pos);
        let scale = no.scale(node);

        // X轴方向翻转检测（用于实现左右转向效果）
        if (this.isTurnX) {
            const shouldFlip = pos.x < this.xTurnPos.min ? -1 : 
                             (pos.x >= this.xTurnPos.max ? 1 : scale.x);
            scale.x = shouldFlip !== scale.x ? shouldFlip : scale.x;
        }

        // Y轴方向翻转检测（用于实现上下翻转效果）
        if (this.isTurnY) {
            const shouldFlip = pos.y < this.yTurnPos.min ? -1 : 
                             (pos.y >= this.yTurnPos.max ? 1 : scale.y);
            scale.y = shouldFlip !== scale.y ? shouldFlip : scale.y;
        }

        no.scale(node, scale);
    }

    /**
     * 设置拖拽节点（通过射线检测）
     * @param event 触摸事件
     * @example
     * // 实现逻辑：
     * // 1. 将屏幕坐标转换为节点本地坐标
     * // 2. 遍历所有YJDragDropItemNode组件
     * // 3. 检测触摸点是否在节点矩形范围内
     * // 4. 找到第一个命中的可拖拽节点
     * // 示例：在库存系统中检测被点击的物品
     */
    protected setDragNode(event: EventTouch) {
        if (!this.dragNode) {
            const p = event.getUILocation();
            // 将屏幕坐标转换为当前节点坐标系的世界坐标
            const pos = no.worldPositionInNode(v3(p.x, p.y), this.node);
            const arr = this.getComponentsInChildren(YJDragDropItemNode);
            
            // 遍历所有可拖拽项进行碰撞检测
            for (let i = 0, n = arr.length; i < n; i++) {
                arr[i].updateNodeRect(); // 更新节点包围框
                const rect = arr[i].nodeRect();
                if (rect.contains(v2(pos.x, pos.y))) {
                    this.dragNode = arr[i].node;
                    break; // 找到第一个符合条件的节点即停止
                }
            }
        }
    }

    /**
     * 设置放置目标节点（通过矩形碰撞检测）
     * @param event 触摸事件
     * @example
     * // 工作流程：
     * // 1. 获取当前触摸的UI位置
     * // 2. 遍历所有YJDragDropTargetNode组件
     * // 3. 检测触摸点是否在目标节点矩形内
     * // 4. 记录第一个符合条件的放置目标
     * // 示例：将药品拖拽到病人身上时检测有效放置区域
     */
    protected setDropTarget(event: EventTouch) {
        if (!this.dropTarget) {
            const pos = event.getUILocation();
            const arr = this.getComponentsInChildren(YJDragDropTargetNode);
            
            for (let i = 0, n = arr.length; i < n; i++) {
                arr[i].updateNodeRect(); // 更新目标区域包围框
                const rect = arr[i].nodeRect();
                if (rect.contains(pos)) {
                    this.dropTarget = arr[i].node; // 记录有效放置目标
                    break;
                }
            }
        }
    }

    /**
     * 更新拖动范围（基于屏幕适配）
     * @example
     * // 计算逻辑：
     * // 1. 根据节点尺寸和锚点计算有效移动范围
     * // 2. 考虑屏幕可见区域进行边界约束
     * // 3. 格式：vec4(左边界, 下边界, 右边界, 上边界)
     * // 示例：教育类应用中限制可拖动元素不超出白板区域
     */
    private updateRange() {
        if (this.isRange && this.range.equals(v4()) && this.dragNode != this.lastDragNode) {
            this.lastDragNode = this.dragNode;
            const nodeSize = no.size(this.dragNode);
            const anchor = no.anchor(this.dragNode);
            const viewSize = YJFitScreen.getVisibleSize();
            
            // 计算各边界的偏移量（考虑锚点对节点位置的影响）
            const range = v4(
                -nodeSize.width * (1 - anchor.x) + viewSize.width,  // 左边界
                -nodeSize.height * (1 - anchor.y) + viewSize.height, // 下边界
                nodeSize.width * (1 - anchor.x) - viewSize.width,   // 右边界
                nodeSize.height * (1 - anchor.y) - viewSize.height  // 上边界
            );
            this.range = range;
        }
    }
}