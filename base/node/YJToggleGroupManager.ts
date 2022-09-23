
import { _decorator, Component, Node, ToggleContainer, Toggle, EventHandler } from 'cc';
import { no } from '../../no';
const { ccclass, property, menu, requireComponent } = _decorator;

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
@requireComponent(ToggleContainer)
export class YJToggleGroupManager extends Component {
    @property(no.EventHandlerInfo)
    onToggleChecked: no.EventHandlerInfo[] = [];

    @property({ tooltip: '是否能重复点击，默认false' })
    redo: boolean = false;

    @property({ tooltip: '在disable时重置选中项' })
    reset: boolean = true;

    @property
    checkOnEnabel: boolean = true;

    @property({ min: 0, displayName: '切换间隔时长(s)' })
    duration: number = 0;

    private checkedToggleUuid: string = null;
    private defaultCheckedIdx: number;
    private needWait: boolean = false;

    onLoad() {
        let items = this.getComponent(ToggleContainer).toggleItems;
        for (let i = 0, n = items.length; i < n; i++) {
            let toggle = items[i];
            let a = new EventHandler();
            a.target = this.node;
            a.component = 'YJToggleGroupManager';
            a.handler = 'a_onCheck';
            toggle.checkEvents.push(a);
        }
    }

    onEnable() {
        let items = this.getComponent(ToggleContainer).toggleItems;
        for (let i = 0, n = items.length; i < n; i++) {
            let toggle = items[i];
            if (this.checkOnEnabel) {
                if (this.defaultCheckedIdx != null && this.reset) {
                    toggle.isChecked = this.defaultCheckedIdx == i;
                }
                if (toggle.isChecked) {
                    if (this.defaultCheckedIdx == null) this.defaultCheckedIdx = i;
                    this.a_onCheck(toggle);
                    break;
                }
            }
        }
    }

    onDisable() {
        this.checkedToggleUuid = null;
    }

    public a_onCheck(toggle: Toggle): void {
        if (!toggle.isChecked) return;
        if (!this.checkDuration()) {
            toggle.setIsCheckedWithoutNotify(false);
            return;
        }
        //避免重复点击
        if (!this.redo && toggle.uuid == this.checkedToggleUuid) return;
        //onToggleChecked回调方法只有1个，则所有toggle checked共用。
        //否则按下标调用对应的回调方法
        this.checkedToggleUuid = toggle.uuid;
        let i = no.indexOfArray(this.getComponent(ToggleContainer).toggleItems, toggle, 'uuid');
        (this.onToggleChecked[i] || this.onToggleChecked[0])?.execute(i);
    }

    public a_check(idx: number): void {
        // if (!this.checkDuration()) {
        //     return;
        // }
        idx = Number(idx);
        let items = this.getComponent(ToggleContainer).toggleItems;
        if (items[idx])
            items[idx].isChecked = true;
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

