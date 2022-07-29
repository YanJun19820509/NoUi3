
import { _decorator, Component, Node } from 'cc';
import { DEBUG, EDITOR } from 'cc/env';
import { FuckUi } from '../fuckui/FuckUi';
import { no } from '../no';
import { YJFuckUiRegister } from './YJFuckUiRegister';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJDataWork
 * DateTime = Thu Jan 13 2022 00:14:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJDataWork.ts
 * FileBasenameNoExtension = YJDataWork
 * URL = db://assets/Script/NoUi3/base/YJDataWork.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJDataWork')
@menu('NoUi/base/YJDataWork(数据处理基类)')
@requireComponent(YJFuckUiRegister)
@executeInEditMode()
export class YJDataWork extends Component {
    @property(YJFuckUiRegister)
    register: YJFuckUiRegister = null;

    private _ready: boolean = false;

    protected _data: no.Data = new no.Data();

    onLoad() {
        if (EDITOR) {
            this.register = this.getComponent(YJFuckUiRegister);
            return;
        }
        this.init();
    }

    /**
     * 初始化，可手动执行，或在onLoad时自动执行，若希望当节点在场景中显示出来之前数据就初始化好，就要在创建节点时（加入场景前）执行init并执行数据相关操作
     * @returns
     */
    public init() {
        if (!this._ready) {
            this.register.onNewUiRegister = (key: string, ui: FuckUi) => {
                this.setUiData([ui], this.getValue(key));
            };
            this._ready = true;
        }
        this.afterInit();
    }

    public get data(): any {
        return this._data.data;
    }

    public set data(d: any) {
        for (let key in d) {
            this.setValue(key, d[key]);
        }
    }

    public getValue(key: string): any {
        return this._data.get(key);
    }

    public setValue(key: string, value: any) {
        this._data.set(key, value);
        if (!this._ready) return;
        this.onValueChange(key, value);
    }

    public clear(): void {
        this._data.clear();
    }

    private onValueChange(key: string, value: any) {
        let ui: FuckUi[] = this.register?.getUis(key) || [];
        this.setUiData(ui, value);
        if (value instanceof Array) {
            value.forEach((v, i) => {
                let ui: FuckUi[] = this.register?.getUis(`${key}.${i}`) || [];
                this.setUiData(ui, v);
            });
        } else if (value instanceof Object) {
            if (DEBUG && value.__classname__) {
                console.warn('不能传递对象类型数据：', key, value);
                return;
            }
            for (let k in value) {
                this.onValueChange(`${key}.${k}`, value[k]);
            }
        }
    }

    private setUiData(uis: FuckUi[], data: any) {
        if (uis == null) return;
        uis.forEach(ui => {
            let keys = ui.bindKeys;
            if (keys.length == 1) {
                ui.setData(JSON.stringify(data));
            } else {
                let a = {};
                keys.forEach(key => {
                    a[key] = this._data.get(key);
                });
                ui.setData(JSON.stringify(a));
            }
        });
    }

    //子类实现
    protected afterInit() {

    }
}
