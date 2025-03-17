import { no } from "../../no";
import { Component, EventTouch, ccclass, property, Node } from "../../yj";
import { YJTouchDispatcher } from "./YJTouchDispatcher";

//touch管理器
@ccclass('YJTouchManager')
/**
 * 触摸管理器组件
 * @desc 
 * - 全局触摸事件管理中心（单例模式）
 * - 统一管理多个事件分发器(YJTouchDispatcher)
 * - 实现触摸事件的分发优先级控制
 * 
 * @example 
 * // 编辑器配置：
 * // 1. 将组件挂载到场景根节点
 * // 2. 勾选"捕获"属性以控制事件阶段
 * 
 * // 代码示例：
 * // 动态注册分发器并处理全局触摸
 * const dispatcher = node.getComponent(YJTouchDispatcher);
 * YJTouchManager.ins.register(dispatcher);
 */
export class YJTouchManager extends Component {
    /** 是否在捕获阶段处理事件（true时优先于子节点响应） */
    @property({ displayName: '捕获' })
    useCapture: boolean = true;

    /** 已注册的事件分发器列表（使用uuid进行去重管理） */
    private _dispatchers: YJTouchDispatcher[] = [];

    /** 单例实例缓存 */
    private static _ins: YJTouchManager;

    /** 获取单例实例 */
    public static get ins(): YJTouchManager {
        return this._ins;
    }

    /**
     * 组件加载时初始化单例
     * @desc 确保场景中只存在一个管理器实例
     */
    onLoad() {
        YJTouchManager._ins = this;
    }

    /**
     * 组件销毁时清理单例
     * @desc 防止残留实例引用导致的内存泄漏
     */
    onDestroy() {
        YJTouchManager._ins = null;
    }

    /**
     * 组件启用时注册触摸事件
     * @desc 监听四个触摸阶段事件，根据useCapture决定监听阶段
     */
    onEnable() {
        this.node.on(Node.EventType.TOUCH_START, this.onStart, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onMove, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_END, this.onEnd, this, this.useCapture);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onCancel, this, this.useCapture);
    }

    /**
     * 组件禁用时移除事件监听
     * @desc 确保组件不可用时不会残留事件监听
     */
    onDisable() {
        this.node.off(Node.EventType.TOUCH_START, this.onStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onCancel, this);
    }

    /**
     * 注册事件分发器
     * @param dispatcher 要注册的分发器实例
     * @desc 使用uuid进行去重，避免重复注册
     */
    public register(dispatcher: YJTouchDispatcher) {
        no.addToArray(this._dispatchers, dispatcher, 'uuid');
    }

    /**
     * 注销事件分发器
     * @param dispatcher 要注销的分发器实例
     * @desc 根据uuid查找并移除对应分发器
     */
    public unregister(dispatcher: YJTouchDispatcher) {
        no.removeFromArray(this._dispatchers, dispatcher, 'uuid');
    }

    /**
     * 触摸开始事件处理
     * @param event 触摸事件对象
     * @desc 遍历所有注册的分发器进行事件分发
     */
    protected onStart(event: EventTouch) {
        for (let i = 0; i < this._dispatchers.length; i++) {
            this._dispatchers[i].onStart(event);
        }
    }

    /**
     * 触摸移动事件处理
     * @param event 触摸事件对象
     * @desc 处理逻辑同onStart，但针对移动阶段
     */
    protected onMove(event: EventTouch) {
        for (let i = 0; i < this._dispatchers.length; i++) {
            this._dispatchers[i].onMove(event);
        }
    }

    /**
     * 触摸结束事件处理
     * @param event 触摸事件对象
     * @desc 处理正常抬起时的结束事件
     */
    protected onEnd(event: EventTouch) {
        for (let i = 0; i < this._dispatchers.length; i++) {
            this._dispatchers[i].onEnd(event);
        }
    }

    /**
     * 触摸取消事件处理
     * @param event 触摸事件对象
     * @desc 处理异常中断的触摸事件（如来电打断）
     */
    protected onCancel(event: EventTouch) {
        for (let i = 0; i < this._dispatchers.length; i++) {
            this._dispatchers[i].onCancel(event);
        }
    }
}


