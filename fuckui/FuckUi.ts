import { Component, DEBUG, EDITOR, ccclass, executeInEditMode, isValid, property, Node } from '../yj';
import { no } from '../no';

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

    @property({ displayName: '绑定数据的keys', tooltip: '用.表示key的层级关系，用,分隔多个key' })
    bind_keys: string = '';

    @property({ displayName: '只赋值一次' })
    private once: boolean = false;

    @property({ displayName: '重值忽略', tooltip: '如果输入的数据与上一次相同则忽略' })
    saveIgnore: boolean = true;

    @property({ displayName: '输出赋值日志' })
    private showValueLog: boolean = false;

    private _oldData: any;

    onLoad() {
        if (EDITOR) {
            if (!this.registerNode) this.registerNode = no.getComponentInParents(this.node, 'YJFuckUiRegister')?.node;
        } else {
            this.update = function () { };
        }
    }

    public setData(d: any, disignore = false) {
        if (!isValid(this?.node)) return;
        if (d == null) {
            this.a_setEmpty();
            this._oldData = null;
            return;
        }
        if (!disignore && this.saveIgnore && no.objectEquals(d, this._oldData)) {
            if (DEBUG && this.showValueLog)
                no.log('重值忽略', this.bind_keys, d);
            return;
        }
        this._oldData = d;

        this.logValue(d);
        this.onDataChange(d);
        if (this.once) {
            this.registerNode.getComponent('YJFuckUiRegister')?.['remove'](this);
            this.destroy();
        }
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

    public a_setData(e: any, v: any) {
        v = v || e;
        this.setData(v);
    }

    public a_clearData() {
        this._oldData = null;
    }

    public resetData(): void {
        if (!this._oldData) return;
        let d = this._oldData;
        if (d != '') {
            try {
                d = no.parse2Json(d);
            } catch (e) {
                no.err('no.parse2Json', 'FuckUi.resetData', d);
            }
        }
        this.logValue(d);
        if (this.enabled)
            this.onDataChange(d);
    }

    protected get oldData(): string {
        return this._oldData;
    }

    protected get dataSetted(): boolean {
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
