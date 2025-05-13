
import { ccclass, property, menu, Component, Node, EventTouch, Touch } from '../../yj';
import { YJTouchDispatcher } from './YJTouchDispatcher';

/**
 * Predefined variables
 * Name = YJTouchController
 * DateTime = Fri Jan 14 2022 17:36:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchController.ts
 * FileBasenameNoExtension = YJTouchController
 * URL = db://assets/Script/common/base/touch/YJTouchController.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* touch控制器
*/
@ccclass('YJTouchController')
@menu('NoUi/touch/YJTouchController(控制器)')
/**
 * 触摸控制器组件
 * @desc 
 * - 负责节点触摸事件的全生命周期管理
 * - 支持事件捕获/冒泡阶段处理
 * - 可配置多点触控、事件吞噬等行为
 * - 通过dispatcher分发具体触摸逻辑
 * 
 * @example
 * // 在编辑器中将组件挂载到需要全局处理触摸的节点（如全屏触摸区域）
 * // 通过属性检查器配置：
 * // 1. 绑定YJTouchDispatcher实例处理具体逻辑
 * // 2. 配置多点触控/事件吞噬等参数
 * 
 * // 动态使用示例：
 * const controller = node.addComponent(YJTouchController);
 * controller.dispatcher = new MyCustomDispatcher();
 * controller.multiable = true;
 */
export class YJTouchController extends Component {
    /** 事件分发器，处理具体触摸逻辑 */
    @property(YJTouchDispatcher)
    dispatcher: YJTouchDispatcher = null;

    /** 是否允许多点触控（当为false时，只响应首个触点） */
    @property({ displayName: '多点触控' })
    multiable: boolean = false;
    
    /** 是否需要先选中节点才能响应（用于实现拖拽等需要初始选中的场景） */
    @property({ displayName: '需要先选中' })
    selected: boolean = true;
    
    /** 是否处理触摸取消事件（如被系统事件打断的情况） */
    @property({ displayName: '处理取消' })
    needCancel: boolean = true;
    
    /** 是否在捕获阶段处理事件（true时优先于子节点响应） */
    @property({ displayName: '捕获' })
    useCapture: boolean = true;
    
    /** 是否阻止事件继续传递（true时不会传递给其他节点） */
    @property({ displayName: '吞噬' })
    canSwallow: boolean = true;

    /** 当前是否处于触摸状态 */
    protected _touched: boolean;
    
    /** 当前处理的触摸对象 */
    protected currentTouch: Touch;

    /**
     * 组件启用时注册触摸事件监听
     * @desc
     * - 根据useCapture参数决定事件监听阶段
     * - 自动绑定四个触摸阶段的事件处理
     * - 注意保持onEnable/onDisable的对称性
     */
    onEnable() {
        this.node.on(Node.EventType.TOUCH_START, this.onStart, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onMove, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_END, this.onEnd, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onCancel, this, this.useCapture);
    }

    /**
     * 组件禁用时移除事件监听
     * @desc
     * - 确保组件不可用时不会残留事件监听
     * - 注意移除顺序与注册顺序一致
     */
    onDisable() {
        this.node.off(Node.EventType.TOUCH_START, this.onStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onCancel, this);
    }

    /**
     * 检查触摸有效性
     * @param event 触摸事件对象
     * @returns 是否允许处理当前触摸
     * @desc
     * - 当启用非多点触控时，只响应首个触点
     * - 已有触点时，新触点会被忽略
     * 
     * @example
     * // 双指触摸场景：
     * // multiable=false时，第二个触点会被拒绝
     * // multiable=true时，两个触点都会被处理
     */
    private checkTouched(event: EventTouch): boolean {
        if (this._touched && !this.multiable && this.currentTouch != null) {
            if (event.getAllTouches().length == 1) return true;
            return this.currentTouch?.getID() == event.touch.getID();
        }
        return true;
    }

    /**
     * 触摸开始事件处理
     * @param event 触摸事件对象
     * @desc
     * - 更新当前触摸状态
     * - 设置事件吞噬行为
     * - 通知dispatcher处理具体逻辑
     */
    protected onStart(event: EventTouch) {
        if (!this.checkTouched(event)) return;
        event.preventSwallow = !this.canSwallow;
        this.currentTouch = event.touch;
        this._touched = true;
        if (this.dispatcher)
            this.dispatcher.onStart(event)
    }

    /**
     * 触摸移动事件处理
     * @param event 触摸事件对象 
     * @desc
     * - 当需要选中模式且未处于触摸状态时忽略
     * - 更新事件吞噬行为
     * - 传递事件给dispatcher
     */
    protected onMove(event: EventTouch) {
        if (this.selected && !this._touched) return;
        event.preventSwallow = !this.canSwallow;
        if (this.dispatcher)
            this.dispatcher.onMove(event)
    }

    /**
     * 触摸结束事件处理
     * @param event 触摸事件对象
     * @desc
     * - 重置触摸状态
     * - 更新事件吞噬行为
     * - 通知dispatcher结束处理
     */
    protected onEnd(event: EventTouch) {
        if (this.selected && !this._touched) return;
        event.preventSwallow = !this.canSwallow;
        this._touched = false;
        this.currentTouch = null;
        if (this.dispatcher)
            this.dispatcher.onEnd(event)
    }

    /**
     * 触摸取消事件处理
     * @param event 触摸事件对象
     * @desc
     * - 根据needCancel决定是否处理
     * - 重置触摸状态
     * - 通知dispatcher取消处理
     */
    protected onCancel(event: EventTouch) {
        if (this.selected && !this._touched || !this.needCancel) return;
        event.preventSwallow = !this.canSwallow;
        this._touched = false;
        this.currentTouch = null;
        if (this.dispatcher)
            this.dispatcher.onCancel(event)
    }

    /**
     * 手动触发触摸事件
     * @param type 事件类型 
     * @param event 触摸事件对象
     * @desc
     * - 用于模拟或转发触摸事件
     * @example
     * // 模拟触摸开始事件
     * const event = new EventTouch();
     * controller.trigger(Node.EventType.TOUCH_START, event);
     */
    public trigger(type: string, event: EventTouch): void {
        switch (type) {
            case Node.EventType.TOUCH_START:
                this.onStart(event);
                break;
            case Node.EventType.TOUCH_MOVE:
                this.onMove(event);
                break;
            case Node.EventType.TOUCH_END:
                this.onEnd(event);
                break;
            case Node.EventType.TOUCH_CANCEL:
                this.onCancel(event);
                break;
        }
    }
}
