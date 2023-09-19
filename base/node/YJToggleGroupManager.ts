
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
@executeInEditMode()
export class YJToggleGroupManager extends Component {
    @property({ displayName: '默认选中项', min: 0, step: 1 })
    defaultCheckedIdx: number = 0;
    @property(no.EventHandlerInfo)
    onToggleChecked: no.EventHandlerInfo[] = [];
    @property(no.EventHandlerInfo)
    onClick: no.EventHandlerInfo[] = [];

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
    private needWait: boolean = false;
    private isInit: boolean = true;

    onLoad() {
        if (EDITOR) {
            this.getComponent(ToggleContainer)?.destroy();
            this.initToggles();
            return;
        }
    }

    onEnable() {
        if (EDITOR) return;
        this.isInit = true;
        // let items = this.getComponentsInChildren(Toggle);
        // for (let i = 0, n = items.length; i < n; i++) {
        //     let toggle = items[i];

        //     if (toggle.isChecked) {

        //         if (this.checkOnEnabel) {
        //             toggle.isChecked = false;
        //             this.a_onCheck(toggle);
        //         }
        //     }
        // }
    }

    onDisable() {
        if (EDITOR) return;
        this.checkedToggleUuid = null;
    }

    public initToggles(): void {
        let items = this.getComponentsInChildren(Toggle);
        for (let i = 0, n = items.length; i < n; i++) {
            let toggle = items[i];
            no.addClickEventsToButton(toggle, this.node, YJToggleGroupManager, 'a_onCheck', false);
            no.addClickEventsToButton(toggle, this.node, YJToggleGroupManager, 'p_onClick', false);
            if (this.checkOnEnabel && this.defaultCheckedIdx == i) {
                if (toggle.isChecked)
                    (this.onToggleChecked[i] || this.onToggleChecked[0])?.execute(i);
                else
                    this.a_onCheck(toggle);
            }
        }
    }


    public a_onCheck(d: any, toggle?: Toggle): void {
        if (!toggle)
            if (d instanceof Toggle) toggle = d;
            else if (d instanceof EventTouch) toggle = d.target.getComponent(Toggle);

        if (toggle.isChecked) {
            if (this.canSwitchOff)
                this.a_check(this.defaultCheckedIndexOnSwitchOff);
            return;
        } else if (!this.checkDuration()) {
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


    private p_onClick(): void {
        no.EventHandlerInfo.execute(this.onClick);
    }

    public a_check(idx: number): void {
        idx = Number(idx);
        let items = this.getComponentsInChildren(Toggle);
        if (items[idx] && !items[idx].isChecked) this.a_onCheck(items[idx]);
    }

    public a_checkWithoutEvent(idx: number) {
        idx = Number(idx);
        let items = this.getComponentsInChildren(Toggle);
        for (let i = 0, n = items.length; i < n; i++) {
            items[i].setIsCheckedWithoutNotify(i == idx);
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

