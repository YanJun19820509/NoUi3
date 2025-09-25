
import { ccclass, property, menu, Component, Node, EventTouch, Rect, EDITOR } from '../../yj';
import { no } from '../../no';
import { YJTouchDispatcher } from './YJTouchDispatcher';

/**
 * Predefined variables
 * Name = YJTouchListener
 * DateTime = Fri Jan 14 2022 17:37:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchListener.ts
 * FileBasenameNoExtension = YJTouchListener
 * URL = db://assets/Script/common/base/touch/YJTouchListener.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
 * touch事件监听器，配合YJTouchDispatcher使用
 */
@ccclass('YJTouchListener')
@menu('NoUi/touch/YJTouchListener(监听器)')
/**
 * 触摸事件监听器组件
 * @desc 
 * - 与YJTouchDispatcher配合实现分层事件处理
 * - 提供完整的触摸生命周期管理（按下/移动/释放/取消）
 * - 支持区域检测和事件吞噬控制
 * 
 * @example
 * // 编辑器配置：
 * // 1. 将组件挂载到需要响应触摸的节点
 * // 2. 拖拽分配dispatcher（或通过代码动态绑定）
 * // 3. 配置各阶段事件回调：
 * //   - 通过属性检查器绑定节点上的组件方法
 * //   - 或代码动态添加：listener.startHandlers.push(new no.EventHandlerInfo(target, component, handler))
 * 
 * // 代码示例：
 * const listener = node.addComponent(YJTouchListener);
 * listener.dispatcher = touchDispatcher; // 绑定分发器
 * listener.startHandlers.push(new no.EventHandlerInfo()
 *   .setTarget(this.node)
 *   .setComponent('MyComponent')
 *   .setHandler('onTouchStart'));
 */
export class YJTouchListener extends Component {
    /** 关联的事件分发器（自动从父节点查找或代码绑定） */
    @property(YJTouchDispatcher)
    dispatcher: YJTouchDispatcher = null;
    @property({ displayName: '优先级', tooltip: '优先级越大，越先处理' })
    priority: number = 0;

    /** 按下事件处理器列表（支持多回调） */
    @property({ type: no.EventHandlerInfo, displayName: '按下事件' })
    startHandlers: no.EventHandlerInfo[] = [];

    /** 移动事件处理器列表（持续触发） */
    @property({ type: no.EventHandlerInfo, displayName: '移动事件' })
    moveHandlers: no.EventHandlerInfo[] = [];

    /** 释放事件处理器列表（正常抬起时触发） */
    @property({ type: no.EventHandlerInfo, displayName: '释放事件' })
    endHandlers: no.EventHandlerInfo[] = [];

    /** 取消事件处理器列表（中断时触发，如来电打断） */
    @property({ type: no.EventHandlerInfo, displayName: '取消事件' })
    cancelHandlers: no.EventHandlerInfo[] = [];

    /** 是否吞噬事件（true时阻止事件继续传递） */
    @property({ displayName: '吞噬' })
    canSwallow: boolean = true;

    @property({ displayName: '是否坐标固定' })
    isFixed: boolean = true;

    /** 当前触摸点是否在有效区域内 */
    protected isTouchIn: boolean = false;

    /** 节点边界区域缓存（基于世界坐标系） */
    protected rect: Rect;

    /**
     * 组件加载时回调
     * @desc 编辑器模式下自动查找父节点中的dispatcher
     */
    onLoad() {
        if (EDITOR) {
            if (!this.dispatcher) this.dispatcher = no.getComponentInParents(this.node, YJTouchDispatcher);
        }
    }

    /**
     * 组件启用时注册到dispatcher
     * @desc 异步确保dispatcher已初始化
     */
    async onEnable() {
        this.a_addToDispatcher();
    }

    /**
     * 组件禁用时从dispatcher移除
     * @desc 确保事件监听不会残留
     */
    onDisable() {
        this.a_removeFromDispatcher();
    }

    public readdListener() {
        this.a_removeFromDispatcher();
        this.a_addToDispatcher();
    }

    public a_addToDispatcher() {
        this.dispatcher?.addListener(this);
    }

    public a_removeFromDispatcher() {
        this.dispatcher?.removeListener(this);
    }

    /**
     * 触摸开始事件处理
     * @param event 触摸事件对象（包含触摸点坐标等信息）
     * @returns 是否处理了事件
     * 
     * @example 回调参数示例：
     * function onTouchStart(event: EventTouch) {
     *   const pos = event.getLocation(); // 获取触摸点坐标
     *   // 处理逻辑...
     * }
     */
    public onStart(event: EventTouch): boolean {
        if (this.rect == null) this.rect = no.nodeBoundingBox(this.node);
        this.isTouchIn = this.rect.contains(event.touch.getUILocation());
        if (!this.isFixed) {
            this.rect = null;
        }
        if (!this.isTouchIn) return false;
        no.EventHandlerInfo.execute(this.startHandlers, event);
        event.preventSwallow = !this.canSwallow;
        return true;
    }

    /**
     * 触摸移动事件处理
     * @param event 触摸事件对象
     * @returns 是否继续传递事件
     */
    public onMove(event: EventTouch): boolean {
        if (!this.isTouchIn) return false;
        no.EventHandlerInfo.execute(this.moveHandlers, event);
        event.preventSwallow = !this.canSwallow;
        return true;
    }

    /**
     * 触摸结束事件处理
     * @param event 触摸事件对象
     * @returns 是否有效结束
     */
    public onEnd(event: EventTouch): boolean {
        if (!this.isTouchIn) return false;
        this.isTouchIn = false;
        no.EventHandlerInfo.execute(this.endHandlers, event);
        event.preventSwallow = !this.canSwallow;
        return true;
    }

    /**
     * 触摸取消事件处理
     * @param event 触摸事件对象
     * @desc 用于处理异常中断情况
     */
    public onCancel(event: EventTouch) {
        if (!this.isTouchIn) return;
        this.isTouchIn = false;
        event.preventSwallow = !this.canSwallow;
        no.EventHandlerInfo.execute(this.cancelHandlers, event);
    }
}
