
import { EDITOR, ccclass, property, menu } from '../yj';
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
export class SetVisibility extends FuckUi {

    @property({ displayName: '取反' })
    reverse: boolean = false;

    @property({ displayName: '默认激活' })
    default: boolean = true;

    onLoad(): void {
        super.onLoad();
        if (!EDITOR) {
            this.show(this.reverse ? !this.default : this.default);
        }
    }

    update() {
        if (EDITOR)
            this.show(this.reverse ? !this.default : this.default);
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
            this.show(Boolean(data));
        }
    }

    private show(v: boolean) {
        if (!this.enabled) return;
        this.reverse && (v = !v);
        no.visible(this.node, v);
    }

    public a_show(): void {
        this.setData('true');
    }

    public a_hide(): void {
        this.setData('false');
    }

    public a_changeVisible(): void {
        this.setData(no.visible(this.node) ? 'false' : 'true');
    }
}
