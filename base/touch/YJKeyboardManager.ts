import { ccclass, Component, EventKeyboard, Input, input } from '../../yj';
import { YJKeyboardDispatcher } from './YJKeyboardDispatcher';
import { no } from '../../no';

@ccclass('YJKeyboardManager')
/**
 * 键盘事件管理器
 * 单例组件，负责全局键盘事件监听和分发
 */
export class YJKeyboardManager extends Component {
    /** 单例实例 */
    private static _ins: YJKeyboardManager;
    /** 已注册的键盘事件分发器列表 */
    private _dispatchers: YJKeyboardDispatcher[] = [];

    /** 
     * 获取单例实例 
     * @returns 当前场景中的键盘管理器实例
     */
    public static get ins(): YJKeyboardManager {
        return this._ins;
    }

    /**
     * 组件加载时初始化单例
     * 确保整个场景中只存在一个管理器实例
     */
    onLoad() {
        YJKeyboardManager._ins = this;
    }

    /**
     * 组件销毁时清理单例引用
     * 防止已销毁实例被继续使用
     */
    onDestroy(): void {
        YJKeyboardManager._ins = null;
    }

    /**
     * 组件启用时注册全局键盘事件监听
     * 开始接收键盘按下/抬起事件
     */
    onEnable(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    /**
     * 组件禁用时取消全局键盘事件监听
     * 停止接收键盘事件并清理资源
     */
    onDisable(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    /**
     * 注册键盘事件分发器
     * @param dispatcher 要注册的分发器实例
     */
    public register(dispatcher: YJKeyboardDispatcher) {
        no.addToArray(this._dispatchers, dispatcher, 'uuid');
    }

    /**
     * 注销键盘事件分发器
     * @param dispatcher 要注销的分发器实例
     */
    public unregister(dispatcher: YJKeyboardDispatcher) {
        no.removeFromArray(this._dispatchers, dispatcher, 'uuid');
    }

    /**
     * 处理全局键盘按下事件
     * @param event 键盘事件对象
     */
    private onKeyDown(event: EventKeyboard) {
        for (let i = 0, n = this._dispatchers.length; i < n; i++) {
            this._dispatchers[i].onKeyDown(event);
        }
    }

    /**
     * 处理全局键盘抬起事件
     * @param event 键盘事件对象
     */
    private onKeyUp(event: EventKeyboard) {
        for (let i = 0, n = this._dispatchers.length; i < n; i++) {
            this._dispatchers[i].onKeyUp(event);
        }
    }
}


