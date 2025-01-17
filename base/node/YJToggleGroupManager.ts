
import { EDITOR, ccclass, property, menu, executeInEditMode, Component, Node, ToggleContainer, Toggle, EventTouch } from '../../yj';
import { } from 'cc/env';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJToggleGroupManager
 * DateTime = Thu Mar 24 2022 16:42:14 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJToggleGroupManager.ts
 * FileBasenameNoExtension = YJToggleGroupManager
 * URL = db://assets/NoUi3/base/node/YJToggleGroupManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//无需也不能与ToggleContainer的checkEvents绑定
@ccclass('YJToggleGroupManager')
@menu('NoUi/node/YJToggleGroupManager(ToggleGroup管理)')
export class YJToggleGroupManager extends ToggleContainer {
    /** 默认选中的toggle索引,当为-1时都不选中 */
    @property({ displayName: '默认选中项', min: -1, step: 1, tooltip: '当为-1时都不选中' })
    defaultCheckedIdx: number = 0;
    /** toggle选中时触发的事件列表 */
    @property(no.EventHandlerInfo)
    onToggleChecked: no.EventHandlerInfo[] = [];

    /** 当前选中的toggle的uuid */
    private checkedToggleUuid: string = null;

    /** 组件加载时注册toggle选中事件 */
    onLoad() {
        if (EDITOR) return;
        this.checkEvents.push(no.createEventHandler(this.node, YJToggleGroupManager, 'a_onCheck'));
    }

    /** 组件禁用时重置选中状态 */
    onDisable() {
        super.onDisable();
        this.checkedToggleUuid = null;
    }

    /** 确保toggle组的状态有效 */
    public ensureValidState() {
        const toggles = this.toggleItems;
        // 如果不允许全部关闭且有toggle时,确保默认选中项被选中
        if (!this._allowSwitchOff && toggles.length !== 0) {
            const toggle = toggles[this.defaultCheckedIdx];
            if (toggle && !toggle.isChecked) {
                toggle.isChecked = true;
                this.notifyToggleCheck(toggle);
            } else {
                this.a_onCheck(toggle);
            }
        }

        // 确保只有一个toggle被选中
        const activeToggles = this.activeToggles();
        if (activeToggles.length > 1) {
            const firstToggle = activeToggles[this.defaultCheckedIdx];
            for (let i = 0; i < activeToggles.length; ++i) {
                const toggle = activeToggles[i];
                if (toggle === firstToggle) {
                    continue;
                }
                toggle.isChecked = false;
            }
        }
    }

    /** 
     * toggle选中时的回调
     * @param d Toggle组件或触摸事件
     */
    public a_onCheck(d: any): void {
        let toggle: Toggle;
        if (d instanceof Toggle) toggle = d;
        else if (d instanceof EventTouch) toggle = d.target.getComponent(Toggle);
        if (!toggle) return;
        if (this.checkedToggleUuid == toggle.uuid) return;
        this.checkedToggleUuid = toggle.uuid;

        const toggles = this.toggleItems;
        let i = toggles.indexOf(toggle);
        no.EventHandlerInfo.execute(this.onToggleChecked, i);
    }

    /**
     * 选中指定索引的toggle
     * @param idx toggle索引
     */
    public a_check(idx: number): void {
        idx = Number(idx);
        let items = this.getComponentsInChildren(Toggle);
        if (!items[idx]) {
            this.defaultCheckedIdx = idx;
            return;
        }
        if (items[idx].isChecked) this.a_onCheck(items[idx]);
        else items[idx].isChecked = true;
    }

    /**
     * 选中指定索引的toggle但不触发事件
     * @param idx toggle索引
     */
    public a_checkWithoutEvent(idx: number) {
        idx = Number(idx);
        let items = this.getComponentsInChildren(Toggle);
        for (let i = 0, n = items.length; i < n; i++) {
            items[i].setIsCheckedWithoutNotify(i == idx);
        }
    }
}

