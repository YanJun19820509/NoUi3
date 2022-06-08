
import { _decorator } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

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

    @property({ displayName: '设置Opacity' })
    isOpacity: boolean = false;

    @property({ displayName: '取反' })
    reverse: boolean = false;

    @property({ displayName: '默认激活' })
    default: boolean = true;

    onLoad() {
        super.onLoad();
        !this.dataSetted && this.show(this.default);
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
        this.reverse && (v = !v);
        if (this.isOpacity) {
            no.opacity(this.node, v ? 255 : 0);
        } else {
            this.node.active = v;
        }
    }

    public a_show(): void {
        this.setData('true');
    }

    public a_hide(): void {
        this.setData('false');
    }


}
