import { YJKeyboardManager } from './YJKeyboardManager';
import { YJKeyboardListener } from './YJKeyboardListener';
import { no } from '../../no';
import { ccclass, Component, EventKeyboard } from '../../yj';

/**
 * 键盘事件分发组件
 * 负责管理键盘监听器并分发键盘事件
 */
@ccclass('YJKeyboardDispatcher')
export class YJKeyboardDispatcher extends Component {
    /** 注册的键盘监听器列表 */
    private listeners: YJKeyboardListener[] = [];

    /**
     * 组件加载时注册到键盘管理器
     * 确保可以接收全局键盘事件
     */
    onEnable() {
        YJKeyboardManager.ins?.register(this);
    }

    /**
     * 组件销毁时从键盘管理器注销
     * 防止内存泄漏
     */
    onDisable(): void {
        YJKeyboardManager.ins?.unregister(this);
    }

    /**
     * 添加键盘监听器
     * @param listener 要添加的监听器实例
     */
    public addListener(listener: YJKeyboardListener) {
        no.addToArray(this.listeners, listener, 'uuid');
    }

    /**
     * 移除键盘监听器 
     * @param listener 要移除的监听器实例
     */
    public removeListener(listener: YJKeyboardListener) {
        no.removeFromArray(this.listeners, listener, 'uuid');
    }

    /**
     * 处理键盘按下事件
     * @param event 键盘事件对象
     */
    public onKeyDown(event: EventKeyboard) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].onKeyDown(event);
        }
    }

    /**
     * 处理键盘抬起事件
     * @param event 键盘事件对象
     */
    public onKeyUp(event: EventKeyboard) {
        for (let i = 0, n = this.listeners.length; i < n; i++) {
            this.listeners[i].onKeyUp(event);
        }
    }
}


