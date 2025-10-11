
import { EDITOR, ccclass, property, menu, requireComponent, Component, Node, Button, EventHandler, EventTouch, disallowMultiple } from '../yj';
import { no } from '../no';
import { YJSoundEffectManager } from '../base/audio/YJSoundEffectManager';

/**
 * Predefined variables
 * Name = YJButton
 * DateTime = Fri Jan 14 2022 18:25:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJButton.ts
 * FileBasenameNoExtension = YJButton
 * URL = db://assets/Script/common/fix/YJButton.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJButton')
@menu('NoUi/fix/YJButton(防连点及trigger)')
@requireComponent(Button)
@disallowMultiple()
/**
 * 防连点按钮组件，支持以下功能：
 * 1. 防止快速连续点击（默认间隔1秒）
 * 2. 支持延时生效功能
 * 3. 支持多点触控过滤
 * 4. 点击音效自动播放
 * 5. 按钮状态联动控制
 * 
 * @example
 * // 编辑器设置示例：
 * // - Delay: 0.5 (防连点间隔设为0.5秒)
 * // - Wait: 1 (按钮激活后1秒才可点击)
 * 
 * // 代码添加点击事件示例：
 * const btn = this.node.getComponent(YJButton);
 * btn.addClickHandler(new EventHandler().set({
 *     target: this.node,
 *     component: 'Test',
 *     handler: 'onClick'
 * }));
 */
export class YJButton extends Component {
    /** 防连点间隔时间（单位：秒），设置为0时关闭防连点功能 */
    @property({ displayName: '防连点间隔时长(s)' })
    delay: number = 1;

    /** 按钮激活后延迟生效时间（单位：秒），用于实现按钮渐显后生效等场景 */
    @property({ displayName: '延时生效(s)', min: 0 })
    wait: number = 0;

    @property({ type: EventHandler, displayName: '点击事件' })
    clickEvents: EventHandler[] = [];

    @property({ displayName: '同步点击事件' })
    get syncEvents(): boolean {
        return false
    }

    set syncEvents(v: boolean) {
        if (v) {
            const btn = this.getComponent(Button);
            this.clickEvents = [];
            for (let i = 0; i < btn.clickEvents.length; i++) {
                this.clickEvents[this.clickEvents.length] = btn.clickEvents[i];
            }
        }
    }


    private _canClick = true; // 总点击开关控制

    private needWait: boolean = false; // 等待间隔标记
    private interactable: boolean; // 原始交互状态缓存

    private _delayCb() {
        this.needWait = false;
    }

    start() {
        this.needWait = false;
        // 首次激活时接管原始点击事件
        const btn = this.getComponent(Button);
        if (this.clickEvents.length == 0) {
            for (let i = 0; i < btn.clickEvents.length; i++) {
                this.clickEvents[this.clickEvents.length] = btn.clickEvents[i];
            }
        }
        btn.clickEvents.length = 0; // 清空原始事件
        // 延时设置代理事件（实现wait功能）
        this.scheduleOnce(() => {
            btn.clickEvents = [no.createClickEvent(this.node, 'YJButton', 'a_trigger')];
        }, this.wait);
    }

    /**
     * 添加自定义点击处理程序
     * @param handler 点击事件处理器
     * @example
     * btn.addClickHandler(new EventHandler()
     *     .setTarget(this.node)
     *     .setComponent('Test')
     *     .setHandler('onClick'));
     */
    public addClickHandler(handler: EventHandler) {
        this.clickEvents[this.clickEvents.length] = handler;
    }

    /**
     * 代理点击事件处理
     * @param event 触摸事件对象（编辑器触发时为null）
     */
    public a_trigger(event: EventTouch) {
        // 全局点击开关关闭时直接返回
        if (!this._canClick && event) return;
        // 过滤多点触控事件
        if (event && event.getAllTouches().length > 1) return;
        // 防连点间隔期间直接返回
        if (this.needWait) return;
        this.needWait = true;

        // 点击时播放标准点击音效
        if (event)
            YJSoundEffectManager.ins?.playClickSoundEffect();
        // 执行所有缓存的事件处理器
        no.executeHandlers(this.clickEvents, event);
        // 重置点击状态（实现防连点间隔）
        this.scheduleOnce(this._delayCb, this.delay);
    }

    /** 设置按钮全局点击开关（同时控制交互状态） */
    public set canClick(v: boolean) {
        this._canClick = v;
        const btn = this.getComponent(Button);
        // 首次设置时缓存原始交互状态
        if (this.interactable == null) this.interactable = btn.interactable;
        // 恢复时使用原始交互状态，关闭时直接禁用
        if (v) btn.interactable = this.interactable;
        else btn.interactable = false;
    }
}