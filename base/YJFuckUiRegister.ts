
import { ccclass, property, disallowMultiple, Component, Node, executeInEditMode } from '../yj';
import { no } from '../no';
import { FuckUi } from '../fuckui/FuckUi';
import { YJDataWork } from './YJDataWork';

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
    public get autoRegister(): boolean {
        return false;
    }

    public set autoRegister(v: boolean) {
        let list = this.getComponentsInChildren(FuckUi);
        for (let i = 0; i < this.subFuckUiNodes.length; i++) {
            list = list.concat(this.subFuckUiNodes[i].getComponentsInChildren(FuckUi));
        }
        for (let i = 0; i < list.length; i++) {
            if (!list[i].registerNode) {
                list[i].registerNode = this.node;
            }
        }

        this.subFuckUis = [];
        for (let i = 0; i < list.length; i++) {
            if (list[i].registerNode == this.node && list[i].bind_keys != '') {
                this.subFuckUis[this.subFuckUis.length] = list[i];
            }
        }
    }

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
        for (let j = 0; j < keys.length; j++) {
            let a: FuckUi[] = this._data2ui[keys[j]];
            if (a) {
                let i = a.indexOf(ui);
                a.splice(i, 1);
            }
        }
    }

    private bindSubFuckUis() {
        let list = this.subFuckUis;
        for (let i = 0, n = list.length; i < n; i++) {
            let ui = list[i];
            let keys = ui.bindKeys;
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (!!key) {
                    this._data2ui[key] = this._data2ui[key] || [];
                    no.addToArray(this._data2ui[key], ui, 'uuid');
                }
            }
        }
    }

    onLoad() {
        this.getComponent(YJDataWork).autoRegister = true;
        this.destroy();
    }
}
