
import { ccclass, property, menu, Component, Node, EventTouch } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJNodeTouchHandler
 * DateTime = Tue Feb 15 2022 13:34:04 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJNodeTouchHandler.ts
 * FileBasenameNoExtension = YJNodeTouchHandler
 * URL = db://assets/common/base/touch/YJNodeTouchHandler.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJNodeTouchHandler')
@menu('NoUi/touch/YJNodeTouchHandler(单个节点的触控处理)')
/**
 * 节点触摸处理组件
 * @desc 
 * - 为单个节点提供完整的触摸事件处理能力
 * - 支持事件捕获阶段处理
 * - 可配置是否吞噬触摸事件
 * 
 * @example
 * // 在编辑器中将组件挂载到需要响应触摸的节点
 * // 通过属性检查器配置各事件回调：
 * // 1. 绑定节点上的其他组件方法
 * // 2. 动态绑定：this.getComponent(YJNodeTouchHandler).touchStart.addHandler(callback)
 */
export class YJNodeTouchHandler extends Component {
    /** 是否在捕获阶段处理事件（影响事件冒泡顺序） */
    @property({ displayName: '捕获' })
    useCapture: boolean = true;
    
    /** 是否阻止事件继续传递（true时阻止事件冒泡） */
    @property({ displayName: '吞噬' })
    canSwallow: boolean = true;
    
    /** 触摸开始事件配置（支持多回调绑定） */
    @property(no.EventHandlerInfo)
    touchStart: no.EventHandlerInfo = new no.EventHandlerInfo();
    
    /** 触摸移动事件配置 */
    @property(no.EventHandlerInfo)
    touchMove: no.EventHandlerInfo = new no.EventHandlerInfo();
    
    /** 触摸结束事件配置 */
    @property(no.EventHandlerInfo)
    touchEnd: no.EventHandlerInfo = new no.EventHandlerInfo();
    
    /** 触摸取消事件配置（如被系统事件打断） */
    @property(no.EventHandlerInfo)
    touchCancel: no.EventHandlerInfo = new no.EventHandlerInfo();

    /**
     * 组件启用时注册事件监听
     * @desc
     * - 根据useCapture参数决定是否在捕获阶段监听
     * - 自动绑定四个触摸阶段的事件
     */
    onEnable() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this, this.useCapture);
    }

    /**
     * 组件禁用时移除事件监听
     * @desc
     * - 确保组件禁用时不会残留事件监听
     * - 注意保持监听/移除的对称性
     */
    onDisable() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    /**
     * 触摸开始事件处理
     * @param e 触摸事件对象
     * @example
     * // 在回调中获取触摸坐标：
     * const pos = e.getUILocation();
     */
    private onTouchStart(e: EventTouch) {
        e.preventSwallow = !this.canSwallow;
        this.touchStart.execute(e);
    }

    /**
     * 触摸移动事件处理
     * @param e 触摸事件对象
     * @desc 适合处理拖拽逻辑
     */
    private onTouchMove(e: EventTouch) {
        e.preventSwallow = !this.canSwallow;
        this.touchMove.execute(e);
    }

    /**
     * 触摸结束事件处理
     * @param e 触摸事件对象
     * @example
     * // 判断点击有效区域：
     * if(e.getUILocation().sub(startPos).mag() < 10) {
     *     // 处理点击逻辑
     * }
     */
    private onTouchEnd(e: EventTouch) {
        e.preventSwallow = !this.canSwallow;
        this.touchEnd.execute(e);
    }

    /**
     * 触摸取消事件处理
     * @param e 触摸事件对象
     * @desc 通常用于重置触摸状态
     */
    private onTouchCancel(e: EventTouch) {
        e.preventSwallow = !this.canSwallow;
        this.touchCancel.execute(e);
    }
}
