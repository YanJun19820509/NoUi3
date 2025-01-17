import { Component, DEBUG, EDITOR, ccclass, executeInEditMode, isValid, property, Node } from '../yj';
import { no } from '../no';
import { YJJobManager } from 'NoUi3/base/YJJobManager';

// export const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = FuckUi
 * DateTime = Thu Jan 13 2022 00:19:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = FuckUi.ts
 * FileBasenameNoExtension = FuckUi
 * URL = db://assets/Script/NoUi3/fuckui/FuckUi.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
* 设置ui属性的基类
*/
@ccclass('FuckUi')
@executeInEditMode()
export class FuckUi extends Component {
    @property({ type: Node, editorOnly: true })
    registerNode: Node = null;

    @property({ displayName: '绑定数据的keys', tooltip: '用,分隔多个key，不支持用.表示key的层级关系' })
    bind_keys: string = '';

    @property({ displayName: '只赋值一次' })
    once: boolean = false;

    // @property({ displayName: '重值忽略', tooltip: '如果输入的数据与上一次相同则忽略' })
    // saveIgnore: boolean = true;

    @property({ displayName: '输出赋值日志' })
    showValueLog: boolean = false;

    public dataDirty: boolean = false;

    private _oldData: any;

    onLoad() {
        if (EDITOR) {
            if (!this.registerNode) this.registerNode = no.getComponentInParents(this.node, 'YJDataWork')?.node;
        } else {
            this.update = function () { };
        }
    }

    /**
     * 设置dataWork的data引用,仅用于YJDataWork中
     * @param d 要设置的数据
     */
    private setData(d: any) {
        if (!isValid(this?.node)) return;
        // if (!disignore && this.saveIgnore && no.objectEquals(d, this._oldData)) {
        //     if (DEBUG && this.showValueLog) {
        //         // no.log('重值忽略', this.bind_keys, d);
        //     }
        //     return;
        // }
        this._oldData = d;

        // this.logValue(d);
        // YJJobManager.ins.addTask(() => {
        //     this.onDataChange(d);
        //     if (this.once) {
        //         this.destroy();
        //     }
        //     return true;
        // });
    }

    /**
     * 获取bind_keys的值
     * @returns 
     */
    public getValue() {
        if (!this._oldData) return null;
        let keys = this.bindKeys;
        let a: any;
        if (keys.length == 1) {
            a = this._oldData[keys[0]];
        } else {
            a = {};
            for (let i = 0; i < keys.length; i++) {
                a[keys[i]] = this._oldData[keys[i]];
            }
        }
        return a;
    }

    /**
     * 更新数据到ui
     */
    public syncData() {
        if (!this.dataDirty) return;
        this.dataDirty = false;
        // this.onDataChange(a);
        // if (this.once) {
        //     this.destroy();
        // }
        YJJobManager.ins.addTask(() => {

            let a = this.getValue();
            if (a == null) {
                this.a_setEmpty();
                return true;
            }
            this.logValue(a);
            this.onDataChange(a);
            if (this.once) {
                this.destroy();
            }
            return true;
        });
    }

    private _keys: string[];
    /**
     * 绑定数据的keys的数组
     */
    public get bindKeys(): string[] {
        if (!this._keys) this._keys = this.bind_keys.split(',');
        return this._keys;
    }

    private logValue(data: any): void {
        if (!DEBUG || !this.showValueLog) return;
        no.log(this.bind_keys, data);
    }

    /**
     *  给指定property赋值
     * @param propertyName
     * @param v
     */
    public setPropertyValue(propertyName: string, v: any): void {
        this[propertyName] = v;
    }

    /**
     * 与setData不同，setData是设置dataWork的data引用
     * 这个是直接设置ui的值，且不会修改dataWork的data
     * @param e 
     * @param v 
     */
    public a_setData(e: any, v?: any) {
        v = v || e;
        this.logValue(v);
        this.onDataChange(v);
        if (this.once) {
            this.destroy();
        }
    }

    /**
     * deprecated
     */
    public a_clearData() {
        //_oldData 是引用，不能直接赋值null
        // this._oldData = null;
    }

    public resetData(): void {
        if (!this.dataSetted) return;
        // let d = this._oldData;
        // this.logValue(d);
        // if (this.enabled)
        //     this.onDataChange(d);
        this.dataDirty = true;
    }

    public get dataSetted(): boolean {
        return this._oldData != null;
    }

    /**
     * 需要子类实际具体逻辑
     * @param data
     */
    protected onDataChange(data: any) {

    }

    public a_setEmpty(): void {

    }

}
