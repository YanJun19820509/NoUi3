
import { _decorator, Component, Node } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
import { FuckUiComponent } from '../types';
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
@ccclass('FuckUiData')
export class FuckUiData {
    @property
    key: string = '';
    @property
    fuckUis: FuckUiComponent[] = [];
}

@ccclass('YJFuckUiRegister')
@disallowMultiple()
@executeInEditMode()
export class YJFuckUiRegister extends Component {
    @property
    autoRegister: boolean = false;

    @property({ type: FuckUiData })
    fuckUiList: FuckUiData[] = [];

    protected _data2ui: object = {};
    private _inited: boolean = false;

    public register(ui: FuckUiComponent, oldBindKeys?: string): void {
        if (oldBindKeys) {
            oldBindKeys.split(',').forEach(key => {
                let a: FuckUiData = no.itemOfArray(this.fuckUiList, key, 'key');
                if (a) {
                    no.removeFromArray(a.fuckUis, ui, 'uuid');
                }
            });
        }
        let keys = ui.bindKeys;
        keys.forEach(key => {
            if (key == '') return;
            let a: FuckUiData = no.itemOfArray(this.fuckUiList, key, 'key');
            if (!a) {
                a = new FuckUiData();
                a.key = key;
                this.fuckUiList[this.fuckUiList.length] = a;
            }
            no.addToArray(a.fuckUis, ui, 'uuid');
        });
    }

    public unregister(ui: FuckUiComponent) {
        let keys = ui.bindKeys;
        keys.forEach(key => {
            let a: FuckUiData = no.itemOfArray(this.fuckUiList, key, 'key');
            if (a) {
                no.removeFromArray(a.fuckUis, ui, 'uuid');
            }
        });
    }

    public init() {
        this.fuckUiList.forEach(ui => {
            this._data2ui[ui.key] = ui.fuckUis;
        });
        this._inited = true;
    }

    public get isInit(): boolean {
        return this._inited;
    }

    public getUis(key: string): FuckUiComponent[] {
        return this._data2ui[key];
    }

    public remove(ui: FuckUiComponent) {
        let keys = ui.bindKeys;
        keys.forEach(key => {
            let a: FuckUiComponent[] = this._data2ui[key];
            if (a) {
                let i = a.indexOf(ui);
                a.splice(i, 1);
            }
        });
    }

    /////////IN EDITOR/////
    update() {
        if (!EDITOR) {
            return;
        }
        if (this.autoRegister) {
            this.autoRegister = false;
            let list = this.getComponentsInChildren('FuckUi');
            list.forEach((a: FuckUiComponent) => {
                if (!a.register)
                    a.register = this;
                if (a.register == this) this.register(a);
            });
        }
    }
}
