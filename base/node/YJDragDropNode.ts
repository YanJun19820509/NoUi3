
import { ccclass, property, Component, Node, EventTouch, math, UITransform, Rect, Vec3, Vec2, Vec4, v4 } from '../../yj';
import { SetNodeTweenAction } from '../../fuckui/SetNodeTweenAction';
import { no } from '../../no';
import { YJTouchListener } from '../touch/YJTouchListener';
import { YJNodeTarget } from './YJNodeTarget';
import { Range } from '../../types';

/**
 * Predefined variables
 * Name = YJDragDropNode
 * DateTime = Thu Sep 29 2022 11:32:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDragDropNode.ts
 * FileBasenameNoExtension = YJDragDropNode
 * URL = db://assets/NoUi3/base/node/YJDragDropNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJDragDropNode')
/**
 * 拖拽节点组件
 * 用于实现节点的拖拽功能,可以设置拖拽目标、返回原点、拖拽范围等功能
 */
export class YJDragDropNode extends YJTouchListener {
    /** 
     * 实际控制移动的节点（默认为当前节点），可用于实现拖拽手柄等分离式控制
     * @example
     * // 使子节点作为拖拽手柄，父节点跟随移动
     * @property({type: Node})
     * moveTarget: Node = this.node.children[0];
     */
    @property({ type: Node, tooltip: '实际移动的节点，默认为当前节点' })
    moveTarget: Node = null;

    /** 
     * 拖拽放置的目标节点配置，支持动态设置
     * @remarks 使用YJNodeTarget实现灵活的目标配置（可包含多个节点或条件判断）
     * @example
     * // 运行时动态设置目标为新建的库存槽位
     * this.dropTo.target = inventoryManager.createNewSlot();
     */
    @property({ type: YJNodeTarget })
    dropTo: YJNodeTarget = null;

    /** 
     * 是否返回原点（当释放时未到达有效目标时生效）
     * @example
     * // 拼图碎片未放入正确位置时返回原位
     * @property canBack: true
     */
    @property({ displayName: '是否返回原点', tooltip: '选中后，当释放时，未到达拖放目标位置或未设置拖放目标时返回初始位置' })
    canBack: boolean = false;

    /** 
     * 接近目标时触发的事件（参数：拖拽节点，目标节点）
     * @example
     * // 接近时播放音效并高亮目标
     * onApproachTarget: [{
     *   target: audioManager,
     *   handler: "playEffect",
     *   customEventData: "approach"
     * }]
     */
    @property({ type: no.EventHandlerInfo, displayName: '接近目标时' })
    onApproachTarget: no.EventHandlerInfo[] = [];

    /** 
     * 离开已接近目标时触发的事件（参数同上）
     * @example
     * // 离开时显示提示文字
     * onAwayFromTarget: [{
     *   target: hintLabel,
     *   component: "Label",
     *   handler: "showText",
     *   customEventData: "请拖拽到指定区域"
     * }]
     */
    @property({ type: no.EventHandlerInfo, displayName: '离开目标时', tooltip: '当已接近目标后又离开时触发' })
    onAwayFromTarget: no.EventHandlerInfo[] = [];

    /** 
     * 成功放入目标时触发的事件（参数同上）
     * @example
     * // 放入时触发得分动画
     * onAchieveTarget: [{
     *   target: scoreManager,
     *   handler: "addScore",
     *   customEventData: 100
     * }]
     */
    @property({ type: no.EventHandlerInfo, displayName: '放入目标时' })
    onAchieveTarget: no.EventHandlerInfo[] = [];

    /** 
     * 点击事件（非拖拽操作时触发）
     * @example
     * // 点击卡牌时显示详细信息
     * onClick: [{
     *   target: cardDetailPanel,
     *   handler: "show"
     * }]
     */
    @property({ type: no.EventHandlerInfo, displayName: '点击时' })
    onClick: no.EventHandlerInfo[] = [];

    /** 
     * 是否开启水平拖动（适用于滑块等水平控制场景）
     * @example
     * // 创建水平音量控制条
     * @property moveX: true
     * @property moveY: false
     */
    @property({ displayName: '开启左右拖动' })
    moveX: boolean = true;

    /** 
     * 是否开启垂直拖动（适用于电梯控制等垂直移动场景）
     * @example
     * // 实现垂直方向进度控制
     * @property moveX: false
     * @property moveY: true
     */
    @property({ displayName: '开启上下拖动' })
    moveY: boolean = true;

    /** 
     * 是否开启拖动范围限制（需配合range属性使用）
     * @remarks 开启后节点移动将受限在指定矩形区域内
     */
    @property({ displayName: '开启拖动范围限制' })
    isRange: boolean = false;

    /** 
     * 拖拽范围约束（Vec4格式：x_min, y_min, x_max, y_max）
     * @remarks 使用世界坐标系，当值为(0,0,0,0)时会自动计算为屏幕可见区域
     * @example
     * // 限制在屏幕左侧半屏区域
     * range: v4(-500, -300, 0, 300)
     */
    @property({ displayName: '拖动范围', visible() { return this.isRange; } })
    range: Vec4 = v4();

    /** 
     * 水平翻转开关（常用于角色方向控制）
     * @example
     * // 实现角色拖拽到左侧时面朝左边
     * @property isTurnX: true
     * @property xTurnPos: { min: -100, max: 100 }
     */
    @property({ displayName: '开启左右翻转', tooltip: '拖动到指定x坐标时进行左右翻转' })
    isTurnX: boolean = false;

    /** 
     * 水平翻转阈值范围（当节点x坐标小于min时scaleX=-1，大于max时scaleX=1）
     * @remarks 使用Range类型可设置缓冲区间避免频繁翻转
     */
    @property({ type: Range, displayName: '左右翻转点x', tooltip: '拖动时x小于该值scaleX为-1，否则为1', visible() { return this.isTurnX; } })
    xTurnPos: Range = Range.new();

    /** 
     * 垂直翻转开关（特殊场景使用，如倒置元素）
     * @example
     * // 实现卡片倒置效果
     * @property isTurnY: true
     * @property yTurnPos: { min: -50, max: 50 }
     */
    @property({ displayName: '开启上下翻转', tooltip: '拖动到指定y坐标时进行上下翻转' })
    isTurnY: boolean = false;

    /** 
     * 垂直翻转阈值范围（逻辑同xTurnPos）
     * @remarks 适用于需要上下镜像反转的特殊场景
     */
    @property({ type: Range, displayName: '上下翻转点y', tooltip: '拖动时x小于该值scaleY为-1，否则为1', visible() { return this.isTurnY; } })
    yTurnPos: Range = Range.new();

    /** 
     * 节点初始位置记录（用于回弹功能）
     * @remarks 当canBack为true时，在组件启动时记录节点初始位置
     * @example
     * // 在拼图游戏中，当拼图未被正确放置时自动回到初始位置
     */
    private _originalPos: Vec3;
    
    /** 
     * 目标区域包围盒缓存（世界坐标系）
     * @remarks 在首次检查接近状态时动态计算，避免重复计算
     * @example
     * // 当拖拽元素进入目标区域时触发高亮效果
     */
    private _targetRect: Rect;
    
    /** 
     * 接近状态标记（用于触发接近/离开事件）
     * @remarks 当节点进入目标区域时设为true，离开时设为false
     * @example
     * // 实现拖拽到垃圾桶附近时垃圾桶自动打开的效果
     */
    private _isApproached: boolean = false;

    /** 
     * 组件初始化生命周期回调
     * @remarks 当canBack为true时记录节点初始位置
     * @example
     * // 在场景加载时记录按钮的初始位置，用于后续拖拽后复位
     */
    start() {
        if (this.canBack) {
            this._originalPos = this.node.position.clone(); // 使用clone避免引用问题
        }
    }

    /** 
     * 触摸开始事件处理
     * @param event 触摸事件对象，包含触摸点信息
     * @returns 是否继续传递事件 
     * @remarks 当不允许回弹时清空位置限制矩形
     * @example
     * // 实现拖动开始时解除位置限制：
     * // canBack=false时允许节点被拖到任意位置
     */
    public onStart(event: EventTouch): boolean {
        if (!this.canBack)
            this.rect = null; // 清空位置限制矩形
        const a = super.onStart(event); // 调用父类触摸处理逻辑
        return a; // 返回事件处理结果
    }

    /** 
     * 触摸移动回调
     * @param event 触摸事件对象
     * @returns 是否处理成功
     * @remarks 处理逻辑：
     * 1. 继承父类触摸移动处理
     * 2. 根据触摸增量更新节点位置
     * 3. 检测目标接近状态变化：
     *    - 当首次进入目标区域时触发onApproachTarget事件
     *    - 当离开目标区域时触发onAwayFromTarget事件
     * @example
     * // 拖拽文件图标到垃圾桶区域时，垃圾桶显示高亮效果
     * // 当拖拽离开时，垃圾桶恢复原状
     */
    public onMove(event: EventTouch): boolean {
        const a = super.onMove(event);
        if (a) {
            // 根据触摸增量更新节点位置
            this.setPosition(event.getUIDelta());
            
            // 检测目标接近状态变化
            if (this.checkIsApproached()) {
                if (!this._isApproached) {
                    this._isApproached = true;
                    // 触发接近事件（参数：当前拖拽节点，目标节点）
                    no.EventHandlerInfo.execute(this.onApproachTarget, this.node, this.dropTo?.node);
                }
            } else if (this._isApproached) {
                this._isApproached = false;
                // 触发离开事件（参数同上）
                no.EventHandlerInfo.execute(this.onAwayFromTarget, this.node, this.dropTo?.node);
            }
        }
        return a;
    }

    /** 
     * 触摸结束回调
     * @param event 触摸事件对象
     * @returns 是否处理成功
     * @remarks 处理逻辑：
     * 1. 继承父类结束处理
     * 2. 如果处于接近状态：触发放置成功事件
     * 3. 否则：执行返回原点动画
     * 4. 检测是否为点击操作（移动距离<10像素）
     * @example
     * // 将拼图放入正确位置时触发成功音效
     * // 未放入时返回原位并播放错误提示
     * // 轻触图标时弹出详情说明
     */
    public onEnd(event: EventTouch): boolean {
        const a = super.onEnd(event);
        if (a) {
            // 处理放置结果
            if (this._isApproached) {
                // 触发放置成功事件（参数：拖拽节点，目标节点）
                no.EventHandlerInfo.execute(this.onAchieveTarget, this.node, this.dropTo?.node);
            } else {
                // 返回初始位置
                this.moveBack();
            }
            
            // 检测点击事件（移动距离小于10像素视为点击）
            if (Vec2.distance(event.getStartLocation(), event.getLocation()) < 10) {
                // 触发点击事件（参数：当前节点）
                no.EventHandlerInfo.execute(this.onClick, this.node);
            }
        }
        return a;
    }

    /** 
     * 触摸取消回调（如被系统中断）
     * @param event 触摸事件对象
     * @remarks 处理逻辑：
     * 1. 如果已接近目标：视为放置成功
     * 2. 否则：执行返回原点动画
     * @example
     * // 来电中断拖拽时：
     * // - 若已在目标区域则保留当前位置
     * // - 否则播放返回动画
     */
    public onCancel(event: EventTouch) {
        if (!this.isTouchIn) return;
        // 统一按正常结束流程处理
        if (this._isApproached) {
            no.EventHandlerInfo.execute(this.onAchieveTarget, this.node, this.dropTo?.node);
        } else {
            this.moveBack();
        }
        super.onCancel(event);
    }

    /** 
     * 检查当前节点是否进入目标区域
     * @returns 是否在目标区域内
     * @remarks 实现逻辑：
     * 1. 检查是否存在目标节点
     * 2. 计算目标节点在父节点坐标系中的包围盒（缓存计算结果）
     * 3. 判断当前节点位置是否在目标区域内
     * @example
     * // 当拼图块进入目标槽位时返回true
     * // 用于触发吸附效果和成功判定
     */
    private checkIsApproached(): boolean {
        if (!this.dropTo) return false;
        if (!this._targetRect) {
            // 获取目标节点世界坐标包围盒
            let rect = no.nodeBoundingBox(this.dropTo.node);
            // 转换中心点到父节点坐标系
            let p = no.vec2ToVec3(rect.center);
            this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(p, p);
            // 构建目标区域矩形（x,y,width,height）
            this._targetRect = math.rect(p.x - rect.width / 2, p.y - rect.height / 2, rect.width, rect.height);
        }
        return this._targetRect?.contains(no.vec3ToVec2(this.node.position));
    }

    /** 
     * 执行返回初始位置的动画
     * @remarks 特性：
     * - 受canBack属性控制是否执行
     * - 使用0.2秒缓动动画平滑移动
     * - 保留原始位置_originalPos用于复位
     * @example
     * // 拖拽失败时调用
     * // 播放元素返回原位的动画效果
     */
    private moveBack() {
        if (!this.canBack) return;
        this.getComponent(SetNodeTweenAction).a_setData({
            duration: 0.2,
            to: 1,
            props: {
                pos: [this._originalPos.x, this._originalPos.y]
            },
            easing: ''
        });
    }

    /** 
     * 更新节点位置并处理边界限制/方向翻转
     * @param deltaPos 本次移动的偏移量
     * @remarks 功能说明：
     * 1. 根据moveX/moveY决定移动轴向
     * 2. 应用移动范围限制（range:[minX, minY, maxX, maxY]）
     * 3. 根据位置阈值自动翻转节点方向（isTurnX/isTurnY）
     * @example
     * // 横版游戏中角色移动时：
     * // - 限制在屏幕范围内移动
     * // - 根据移动方向翻转精灵朝向
     */
    private setPosition(deltaPos: Vec2) {
        const node = this.moveTarget || this.node;
        let pos = no.position(node);
        // 应用轴向移动（允许单独锁定X/Y轴）
        pos.add3f(this.moveX ? deltaPos.x : 0, this.moveY ? deltaPos.y : 0, 0);
        
        // 边界限制处理
        if (this.isRange) {
            pos.x = math.clamp(pos.x, this.range.x, this.range.z);
            pos.y = math.clamp(pos.y, this.range.y, this.range.w);
        }
        no.position(node, pos);
        
        // 方向翻转逻辑
        let scale = no.scale(node);
        // X轴翻转（如角色左右转向）
        if (this.isTurnX) {
            if (pos.x < this.xTurnPos.min && scale.x != -1)
                scale.x = -1;
            else if (pos.x >= this.xTurnPos.max && scale.x != 1)
                scale.x = 1;
        }
        // Y轴翻转（如上下坡道时精灵翻转）
        if (this.isTurnY) {
            if (pos.y < this.yTurnPos.min && scale.y != -1)
                scale.y = -1;
            else if (pos.y >= this.yTurnPos.max && scale.y != 1)
                scale.y = 1;
        }
        no.scale(node, scale);
    }

    // private getTouchLocation(event: EventTouch): math.Vec2 {
    //     let pos = math.v2();
    //     event.getUILocation(pos);
    //     let ut: UITransform = event.target.getComponent(UITransform);
    //     let size = ut.contentSize,
    //         ap = ut.anchorPoint;
    //     pos.x += (ap.x - 0.5) * size.width;
    //     pos.y += (ap.y - 0.5) * size.height;
    //     return pos;
    // }
}
