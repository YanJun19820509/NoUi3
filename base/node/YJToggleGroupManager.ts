
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
    @property({ displayName: '默认选中项', min: -1, step: 1, tooltip: '当为-1时都不选中' })
    defaultCheckedIdx: number = 0;
    @property(no.EventHandlerInfo)
    onToggleChecked: no.EventHandlerInfo[] = [];

    private checkedToggleUuid: string = null;

    onLoad() {
        if (EDITOR) return;
        this.checkEvents.push(no.createEventHandler(this.node, YJToggleGroupManager, 'a_onCheck'));
    }

    onDisable() {
        super.onDisable();
        this.checkedToggleUuid = null;
    }

    public ensureValidState() {
        const toggles = this.toggleItems;
        if (!this._allowSwitchOff && toggles.length !== 0) {
            const toggle = toggles[this.defaultCheckedIdx];
            if (toggle && !toggle.isChecked) {
                toggle.isChecked = true;
                this.notifyToggleCheck(toggle);
            } else {
                this.a_onCheck(toggle);
            }
        }

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

    public a_onCheck(d: any): void {
        let toggle: Toggle;
        if (d instanceof Toggle) toggle = d;
        else if (d instanceof EventTouch) toggle = d.target.getComponent(Toggle);
        if (!toggle) return;
        if (this.checkedToggleUuid == toggle.uuid) return;
        this.checkedToggleUuid = toggle.uuid;

        let i = no.indexOfArray(this.getComponentsInChildren(Toggle), toggle, 'uuid');
        no.EventHandlerInfo.execute(this.onToggleChecked, i);
    }

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

    public a_checkWithoutEvent(idx: number) {
        idx = Number(idx);
        let items = this.getComponentsInChildren(Toggle);
        for (let i = 0, n = items.length; i < n; i++) {
            items[i].setIsCheckedWithoutNotify(i == idx);
        }
    }
}

