
import { _decorator, Component, Node } from 'cc';
import { no } from '../../no';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJCheckLocalStorage
 * DateTime = Fri Jan 14 2022 15:32:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCheckLocalStorage.ts
 * FileBasenameNoExtension = YJCheckLocalStorage
 * URL = db://assets/Script/NoUi3/base/localstorage/YJCheckLocalStorage.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('CheckLocalStorageInfo')
export class CheckLocalStorageInfo {
    @property
    value: string = '';
    @property(no.EventHandlerInfo)
    handlers: no.EventHandlerInfo[] = [];
}

@ccclass('YJCheckLocalStorage')
@menu('NoUi/localstorage/YJCheckLocalStorage(检测本地缓存数据)')
export class YJCheckLocalStorage extends Component {
    @property
    key: string = '';
    @property
    usePreKey: boolean = true;

    @property({ displayName: '默认值' })
    defaultValue: string = '';

    @property(CheckLocalStorageInfo)
    infos: CheckLocalStorageInfo[] = [];

    @property({ tooltip: '自动执行检测并监听数据变更' })
    auto: boolean = true;

    private _value: string;

    start() {
        if (this.key == '') return;
        if (this.auto) {
            this.a_check();
        }
    }

    public a_check() {
        if (this.key == '') return;
        let v = (this.usePreKey ? no.dataCache.getLocal(this.key) : localStorage.getItem(this.key)) || this.defaultValue;
        if (this._value == v) return;
        this._value = v;
        this.infos.forEach(info => {
            if (info.value == v) {
                no.EventHandlerInfo.execute(info.handlers);
            }
        });
    }

    update() {
        if (!this.auto) return;
        this.a_check();
    }
}
