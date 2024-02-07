
import { EDITOR, ccclass, property, menu, executeInEditMode } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetVisibility
 * DateTime = Mon Jan 17 2022 14:44:31 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetVisibility.ts
 * FileBasenameNoExtension = SetVisibility
 * URL = db://assets/Script/NoUi3/fuckui/SetVisibility.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetVisibility')
@menu('NoUi/ui/SetVisibility(设置显隐:bool)')
@executeInEditMode()
export class SetVisibility extends FuckUi {

    @property({ displayName: '取反' })
    reverse: boolean = false;
    @property({ displayName: '默认激活' })
    public get defaultActive(): boolean {
        return this.default;
    }

    public set defaultActive(v: boolean) {
        if (this.default == v) return;
        this.default = v;
        no.visible(this.node, v);
    }

    @property({ serializable: true, visible() { return false; } })
    protected default: boolean = true;

    /**
     * @deprecated
     */
    private _needSetDefault: boolean = true;
    onLoad() {
        super.onLoad();
        if (!EDITOR && this._needSetDefault) {
            this.setDefault();
        }
    }

    protected onDataChange(data: any) {
        if (data instanceof Object) {
            let a = true;
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    if (!data[key]) {
                        a = false;
                        break;
                    }
                }
            }
            this.show(a);
        } else {
            if (data == 'null') this.show(false);
            else
                this.show(Boolean(data));
        }
    }

    private setDefault() {
        if (this.dataSetted) return;
        if (this.default) no.visible(this.node, true);
        else no.visible(this.node, false);
    }

    private show(v: boolean) {
        if (!this.enabled) return;
        this.reverse && (v = !v);
        no.visible(this.node, v);
        // no.log('$$$$$$$$$$$$  SetVisibility', this.bind_keys, v);
    }

    public a_show(): void {
        this._needSetDefault = false;
        this.setData('true');
    }

    public a_hide(): void {
        this._needSetDefault = false;
        this.setData('false');
    }

    public a_changeVisible(): void {
        this._needSetDefault = false;
        this.setData(no.visible(this.node) ? 'false' : 'true');
    }
}
