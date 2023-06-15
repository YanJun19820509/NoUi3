
import { EDITOR, ccclass, property, disallowMultiple, executeInEditMode, Component, Node } from '../yj';
import { no } from '../no';
import { FuckUi } from '../fuckui/FuckUi';

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
    @property({ type: FuckUi })
    subFuckUis: FuckUi[] = [];

    protected _data2ui: object = {};

    private _inited: boolean = false;

    public init() {
        this.bindSubFuckUis()
        this._inited = true;
    }

    public get isInit(): boolean {
        return this._inited;
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

    private bindSubFuckUis() {
        // let list: FuckUi[] = this.getComponentsInChildren('FuckUi') as FuckUi[];
        // this.subFuckUiNodes.forEach(sub => {
        //     if (sub)
        //         list = list.concat(sub.getComponentsInChildren('FuckUi') as FuckUi[]);
        // });
        let list = this.subFuckUis;
        for (let i = 0, n = list.length; i < n; i++) {
            let ui = list[i];
            if (ui?.registerNode == this.node) {
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
        let list = this.getComponentsInChildren(FuckUi);
        this.subFuckUiNodes.forEach(sub => {
            list = list.concat(sub.getComponentsInChildren(FuckUi));
        });
        list.forEach((a: FuckUi) => {
            if (!a.registerNode) {
                a.registerNode = this.node;
            }
        });

        this.subFuckUis = [];
        list.forEach((a: FuckUi) => {
            if (a.registerNode == this.node && a.bind_keys != '') {
                this.subFuckUis[this.subFuckUis.length] = a;
            }
        });
    }
}
