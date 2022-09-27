
import { _decorator, Component, Node, ToggleContainer, Toggle, EventHandler, EventTouch, js } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../../no';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

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
@executeInEditMode()
export class YJToggleGroupManager extends Component {
    @property(no.EventHandlerInfo)
    onToggleChecked: no.EventHandlerInfo[] = [];

    @property({ tooltip: '在disable时重置选中项' })
    reset: boolean = true;

    @property
    checkOnEnabel: boolean = true;

    @property({ min: 0, displayName: '切换间隔时长(s)' })
    duration: number = 0;

    @property({ tooltip: '可反复点击在选中与未选中间切换' })
    canSwitchOff: boolean = false;
    @property({ visible() { return this.canSwitchOff; }, tooltip: '取消选中时的默认选中项下标', min: 0, step: 1 })
    defaultCheckedIndexOnSwitchOff: number = 0;

    private checkedToggleUuid: string = null;
    private defaultCheckedIdx: number;
    private needWait: boolean = false;

    onLoad() {
        if (EDITOR) {
            this.getComponent(ToggleContainer)?.destroy();
            let items = this.getComponentsInChildren(Toggle);
            for (let i = 0, n = items.length; i < n; i++) {
                let toggle = items[i];
                let a = new EventHandler();
                a.target = this.node;
                a._componentId = js._getClassId(YJToggleGroupManager);
                a.handler = 'a_onCheck';
                toggle.clickEvents = [a];
            }
            return;
        }
    }

    onEnable() {
        if (EDITOR) return;
        let items = this.getComponentsInChildren(Toggle);
        for (let i = 0, n = items.length; i < n; i++) {
            let toggle = items[i];
            if (this.checkOnEnabel) {
                if (this.defaultCheckedIdx != null && this.reset) {
                    toggle.isChecked = this.defaultCheckedIdx == i;
                }
                if (toggle.isChecked) {
                    toggle.isChecked = false;
                    if (this.defaultCheckedIdx == null) this.defaultCheckedIdx = i;
                    this.a_onCheck(toggle);
                    break;
                }
            }
        }
    }

    onDisable() {
        if (EDITOR) return;
        this.checkedToggleUuid = null;
    }

    public a_onCheck(d: any): void {
        let toggle: Toggle;
        if (d instanceof Toggle) toggle = d;
        else if (d instanceof EventTouch) toggle = d.target.getComponent(Toggle);

        if (toggle.isChecked)
            if (!this.canSwitchOff) {
                return;
            } else {
                this.a_check(this.defaultCheckedIndexOnSwitchOff);
            }
        else if (!this.checkDuration()) {
            this.setCheckByUuid(this.checkedToggleUuid);
            return;
        } else {
            this.setCheckByUuid(toggle.uuid);
        }

        this.checkedToggleUuid = toggle.uuid;

        //onToggleChecked回调方法只有1个，则所有toggle checked共用。
        //否则按下标调用对应的回调方法
        let i = no.indexOfArray(this.getComponentsInChildren(Toggle), toggle, 'uuid');
        (this.onToggleChecked[i] || this.onToggleChecked[0])?.execute(i);
    }

    public a_check(idx: number): void {
        idx = Number(idx);
        let items = this.getComponentsInChildren(Toggle);
        for (let i = 0, n = items.length; i < n; i++) {
            items[i].isChecked = idx == i;
            if (!this.canSwitchOff)
                items[i].interactable = !items[i].isChecked;
        }
    }

    private setCheckByUuid(uuid: string) {
        this.scheduleOnce(() => {
            let items = this.getComponentsInChildren(Toggle);
            for (let idx = 0, n = items.length; idx < n; idx++) {
                items[idx].isChecked = items[idx].uuid == uuid;
                if (!this.canSwitchOff)
                    items[idx].interactable = !items[idx].isChecked;
            }
        });
    }

    private checkDuration(): boolean {
        if (this.duration == 0) return true;
        if (this.needWait) return false;
        this.needWait = true;
        this.scheduleOnce(() => {
            this.needWait = false;
        }, this.duration);
        return true;
    }
}

