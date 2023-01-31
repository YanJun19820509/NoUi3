
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
@ccclass('YJFuckUiRegister')
@disallowMultiple()
@executeInEditMode()
export class YJFuckUiRegister extends Component {
    @property
    autoRegister: boolean = false;

    @property(Node)
    subFuckUiNodes: Node[] = [];

    @property({ readonly: true })
    private subFuckUis: FuckUiComponent[] = [];

    protected _data2ui: object = {};

    private _inited: boolean = false;

    public init() {
        this.bindSubFuckUis()
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

    private bindSubFuckUis() {
        // let list: FuckUiComponent[] = this.getComponentsInChildren('FuckUi') as FuckUiComponent[];
        // this.subFuckUiNodes.forEach(sub => {
        //     if (sub)
        //         list = list.concat(sub.getComponentsInChildren('FuckUi') as FuckUiComponent[]);
        // });
        let list = this.subFuckUis;
        for (let i = 0, n = list.length; i < n; i++) {
            let ui = list[i];
            if (ui?.register == this) {
                let keys = ui.bindKeys;
                keys.forEach(key => {
                    if (!!key) {
                        this._data2ui[key] = this._data2ui[key] || [];
                        no.addToArray(this._data2ui[key], ui, 'uuid');
                    }
                });
            }
        }
    }

    /////////IN EDITOR/////
    update() {
        if (!EDITOR) {
            return;
        }
        if (this.autoRegister) {
            this.autoRegister = false;
            this.autoSetSubRegister();
        }
    }

    public autoSetSubRegister() {
        if (!EDITOR) return;
        let list = this.getComponentsInChildren('FuckUi');
        this.subFuckUiNodes.forEach(sub => {
            list = list.concat(sub.getComponentsInChildren('FuckUi'));
        });
        list.forEach((a: FuckUiComponent) => {
            if (!a.register) {
                a.register = this;
            }
        });

        this.subFuckUis = [];
        list.forEach((a: FuckUiComponent) => {
            if (a.register == this && a.bind_keys != '') {
                this.subFuckUis[this.subFuckUis.length] = a;
            }
        });
    }
}
