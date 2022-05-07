
import { _decorator, Component, Node, ToggleContainer, Toggle, CCBoolean } from 'cc';
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

@ccclass('YJToggleGroupManager')
@menu('NoUi/node/YJToggleGroupManager(ToggleGroup管理)')
@requireComponent(ToggleContainer)
export class YJToggleGroupManager extends Component {
    @property(no.EventHandlerInfo)
    onToggleChecked: no.EventHandlerInfo[] = [];

    @property({ tooltip: '是否能重复点击，默认false，checked后点击无效' })
    redo: boolean = false;

    @property({ tooltip: '在disable时重置选中项' })
    reset: boolean = true;

    private checkedToggleUuid: string = null;
    private defaultCheckedIdx: number;

    onEnable() {
        let items = this.getComponent(ToggleContainer).toggleItems;
        for (let i = 0, n = items.length; i < n; i++) {
            let toggle = items[i];
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

    onDisable() {
        this.checkedToggleUuid = null;
    }

    public a_onCheck(toggle: Toggle): void {
        //避免重复点击
        if (!this.redo && toggle.uuid == this.checkedToggleUuid) return;
        //onToggleChecked回调方法只有1个，则所有toggle checked共用。
        //否则按下标调用对应的回调方法
        this.checkedToggleUuid = toggle.uuid;
        let i = no.indexOfArray(this.getComponent(ToggleContainer).toggleItems, toggle, 'uuid');
        (this.onToggleChecked[i] || this.onToggleChecked[0])?.execute(i);
    }


}

