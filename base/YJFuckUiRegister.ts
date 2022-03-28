
import { _decorator, Component, Node } from 'cc';
import { FuckUi } from '../fuckui/FuckUi';
const { ccclass, property, disallowMultiple } = _decorator;

/**
 * Predefined variables
 * Name = YJFuckUiRegister
 * DateTime = Thu Jan 13 2022 00:15:31 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJFuckUiRegister.ts
 * FileBasenameNoExtension = YJFuckUiRegister
 * URL = db://assets/Script/NoUi3/base/YJFuckUiRegister.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
 
@ccclass('YJFuckUiRegister')
@disallowMultiple()
export class YJFuckUiRegister extends Component {
    protected _data2ui: object = {};

    public onNewUiRegister: (key: string, ui: FuckUi) => void;

    public register(ui: FuckUi): void {
        let keys = ui.bindKeys;
        keys.forEach(key => {
            this._data2ui[key] = this._data2ui[key] || [];
            this._data2ui[key][this._data2ui[key].length] = ui;
            this.onNewUiRegister?.(key, ui);
        });
    }

    public getUis(key: string): FuckUi[] {
        return this._data2ui[key];
    }

    public remove(ui: FuckUi) {
        let keys = ui.bindKeys;
        keys.forEach(key => {
            let a: FuckUi[] = this._data2ui[key];
            if (a) {
                let i = a.indexOf(ui);
                a.splice(i, 1);
            }
        });
    }
}
