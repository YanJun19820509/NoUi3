
import { ccclass, menu, Component, Node, EventTouch, property } from '../../yj';
import { no } from '../../no';
import { YJTouchListener } from './YJTouchListener';
import { YJTouchManager } from './YJTouchManager';

/**
 * Predefined variables
 * Name = YJTouchDispatcher
 * DateTime = Fri Jan 14 2022 17:37:12 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJTouchDispatcher.ts
 * FileBasenameNoExtension = YJTouchDispatcher
 * URL = db://assets/Script/common/base/touch/YJTouchDispatcher.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
/**
* touch事件分发器，配合YJTouchListener使用
*/
@ccclass('YJTouchDispatcher')
@menu('NoUi/touch/YJTouchDispatcher(分发器)')
/**
 * 触摸事件分发器组件
 * @desc 
 * - 负责管理多个触摸监听器(YJTouchListener)
 * - 实现触摸事件的分发逻辑和优先级控制
 * - 支持自动注册到全局触摸管理器
 * 
 * @example 
 * // 在编辑器中配置：
 * // 1. 将组件挂载到需要处理触摸的节点
 * // 2. 勾选"注册到管理器"以便全局访问
 * // 3. 通过代码动态添加监听器：
 * 
 * const dispatcher = node.getComponent(YJTouchDispatcher);
 * dispatcher.addListener(new MyTouchListener());
 */
export class YJTouchDispatcher extends Component {
    /** 是否自动注册到触摸管理器（开启后可通过管理器全局访问） */
    @property({ displayName: '注册到管理器' })
    addToManager: boolean = false;

    /**
     * 组件加载时回调
     * @desc 如果开启注册到管理器，会自动加入YJTouchManager单例
     */
    onLoad() {
        if (this.addToManager) YJTouchManager.ins.register(this);
    }

    /**
     * 组件销毁时回调
     * @desc 如果之前注册过管理器，会执行注销操作
     */
    onDestroy() {
        if (this.addToManager) YJTouchManager.ins?.unregister(this);
    }

    /** 存储已注册的触摸监听器列表（使用uuid防止重复添加） */
    private listeners: YJTouchListener[] = [];

    /**
     * 触摸开始事件处理
     * @param event 触摸事件对象
     * @desc 
     * - 按监听器注册顺序依次调用
     * - 当某个监听器返回true且未标记preventSwallow时终止传递
     */
    public onStart(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            if (this.listeners[i].onStart(event) && !event.preventSwallow) break;
        }
    }

    /**
     * 触摸移动事件处理
     * @param event 触摸事件对象
     * @desc 处理逻辑同onStart，但针对移动阶段
     */
    public onMove(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            if (this.listeners[i].onMove(event) && !event.preventSwallow) break;
        }
    }

    /**
     * 触摸结束事件处理
     * @param event 触摸事件对象
     * @desc 处理逻辑同onStart，但针对结束阶段
     */
    public onEnd(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            if (this.listeners[i].onEnd(event) && !event.preventSwallow) break;
        }
    }

    /**
     * 触摸取消事件处理
     * @param event 触摸事件对象
     * @desc 
     * - 会通知所有监听器（无论是否阻止冒泡）
     * - 通常用于处理系统中断导致的触摸终止
     */
    public onCancel(event: EventTouch) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].onCancel(event);
        }
    }

    /**
     * 添加触摸监听器
     * @param listener 要添加的监听器实例
     * @desc 使用uuid机制防止重复添加相同实例
     * @example
     * const listener = new YJTouchListener();
     * dispatcher.addListener(listener);
     */
    public addListener(listener: YJTouchListener) {
        if (no.indexOfArray(this.listeners, listener, 'uuid') == -1) {
            //同一场景中，先添加的节点的层级在下，所以后添加需要先处理
            this.listeners.unshift(listener);
        }
    }

    /**
     * 移除触摸监听器
     * @param listener 要移除的监听器实例
     * @desc 根据uuid匹配要移除的实例
     * @example
     * dispatcher.removeListener(existingListener);
     */
    public removeListener(listener: YJTouchListener) {
        no.removeFromArray(this.listeners, listener, 'uuid');
    }
}
