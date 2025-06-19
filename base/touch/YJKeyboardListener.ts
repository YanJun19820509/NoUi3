import { _decorator, Component, Node, EventKeyboard } from 'cc';
import { YJKeyboardDispatcher } from './YJKeyboardDispatcher';
import { no } from '../../no';
import { EDITOR } from '../../yj';
const { ccclass, property } = _decorator;

@ccclass('YJKeyboardListener')
/**
 * 键盘事件监听组件
 * 用于接收并处理键盘按下/抬起事件，需要配合YJKeyboardDispatcher使用
 */
export class YJKeyboardListener extends Component {
    /** 关联的键盘事件分发器（未指定时会自动查找父节点中的分发器） */
    @property(YJKeyboardDispatcher)
    dispatcher: YJKeyboardDispatcher = null;

    /** 键盘按下事件处理函数列表（参数为按键码） */
    @property({ type: no.EventHandlerInfo, displayName: '按下事件' })
    onKeyDownHandler: no.EventHandlerInfo[] = [];

    /** 键盘抬起事件处理函数列表（参数为按键码） */
    @property({ type: no.EventHandlerInfo, displayName: '抬起事件' })
    onKeyUpHandler: no.EventHandlerInfo[] = [];

    /**
     * 组件加载时处理
     * 在编辑器模式下自动查找父节点中的键盘分发器
     */
    onLoad() {
        if (EDITOR) {
            if (!this.dispatcher) this.dispatcher = no.getComponentInParents(this.node, YJKeyboardDispatcher);
        }
    }

    /**
     * 组件启用时注册到分发器
     */
    async onEnable() {
        this.dispatcher?.addListener(this);
    }

    /**
     * 组件禁用时从分发器注销
     */
    onDisable() {
        this.dispatcher?.removeListener(this);
    }

    /**
     * 处理键盘按下事件
     * @param event 键盘事件对象
     */
    public onKeyDown(event: EventKeyboard) {
        for (let i = 0, n = this.onKeyDown.length; i < n; i++) {
            no.EventHandlerInfo.execute(this.onKeyDownHandler, event.keyCode);
        }
    }

    /**
     * 处理键盘抬起事件 
     * @param event 键盘事件对象
     */
    public onKeyUp(event: EventKeyboard) {
        for (let i = 0, n = this.onKeyDown.length; i < n; i++) {
            no.EventHandlerInfo.execute(this.onKeyUpHandler, event.keyCode);
        }
    }
}


