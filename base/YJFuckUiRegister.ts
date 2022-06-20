
import { _decorator, Component, Node } from 'cc';
import { EDITOR } from 'cc/env';
import { _FuckUi } from '../types';
const { ccclass, property, disallowMultiple, executeInEditMode } = _decorator;

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
@executeInEditMode()
export class YJFuckUiRegister extends Component {
    @property
    autoRegister: boolean = false;

    protected _data2ui: object = {};

    public onNewUiRegister: (key: string, ui: _FuckUi) => void;

    public register(ui: _FuckUi): void {
        let keys = ui.bindKeys;
        keys.forEach(key => {
            this._data2ui[key] = this._data2ui[key] || [];
            this._data2ui[key][this._data2ui[key].length] = ui;
            this.onNewUiRegister?.(key, ui);
        });
    }

    public getUis(key: string): any[] {
        return this._data2ui[key];
    }

    public remove(ui: _FuckUi) {
        let keys = ui.bindKeys;
        keys.forEach(key => {
            let a: _FuckUi[] = this._data2ui[key];
            if (a) {
                let i = a.indexOf(ui);
                a.splice(i, 1);
            }
        });
    }

    /////////IN EDITOR/////
    update() {
        if (!EDITOR) return;
        if (this.autoRegister) {
            this.autoRegister = false;
            let list = this.getComponentsInChildren('FuckUi');
            list.forEach((a: _FuckUi) => {
                a.register = this;
            });
        }
    }
}
