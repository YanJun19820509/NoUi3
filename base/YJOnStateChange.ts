
import { _decorator, Component, Node, CCString, isValid, macro } from 'cc';
import { no } from '../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJOnStateChange
 * DateTime = Fri Sep 09 2022 15:31:37 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJOnStateChange.ts
 * FileBasenameNoExtension = YJOnStateChange
 * URL = db://assets/NoUi3/base/YJOnStateChange.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//监听no.state状态组件
@ccclass('StateValueInfo')
export class StateValueInfo {
    @property
    value: string = '';
    @property({ type: no.EventHandlerInfo })
    handlers: no.EventHandlerInfo[] = [];
}
@ccclass('StateInfo')
export class StateInfo {
    @property({ tooltip: '多个key用,分隔，当其中某一个key的状态发生变化就会触发，不要用在多个key的状态会同时发生变化的情况' })
    keys: string = '';
    @property({ type: StateValueInfo })
    values: StateValueInfo[] = [];

    private _keys: string[];

    private onStateChange(value: any) {
        for (let i = 0, n = this.values.length; i < n; i++) {
            let svi = this.values[i];
            if (svi.value == String(value)) {
                no.EventHandlerInfo.execute(svi.handlers);
                break;
            }
        }
    }

    public check() {
        if (!this._keys) {
            this._keys = this.keys.split(',');
        }
        for (let i = 0, n = this._keys.length; i < n; i++) {
            const key = this._keys[i];
            const a = no.state.check(key, this);
            if (a.state) this.onStateChange(a.value == undefined ? '' : a.value);
        }
    }
}
@ccclass('YJOnStateChange')
export class YJOnStateChange extends Component {
    @property({ type: StateInfo })
    states: StateInfo[] = [];

    private _idx: number = 0;

    protected onEnable(): void {
        this.schedule(this.check, .1, macro.REPEAT_FOREVER);
    }

    protected onDisable(): void {
        this.unschedule(this.check);
    }

    private check() {
        if (!isValid(this?.node)) return;
        if (this._idx >= this.states.length) this._idx = 0;
        const state = this.states[this._idx];
        state.check();
        this._idx++;
    }
}
