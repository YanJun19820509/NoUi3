
import { _decorator } from './yj';
import { YJi18n } from '../base/YJi18n';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { SetText } from './SetText';
const { ccclass, requireComponent, menu } = _decorator;

/**
 * Predefined variables
 * Name = Seti18n
 * DateTime = Thu Apr 14 2022 14:28:05 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = Seti18n.ts
 * FileBasenameNoExtension = Seti18n
 * URL = db://assets/NoUi3/fuckui/Seti18n.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('Seti18n')
@menu('NoUi/ui/Seti18n(本地化:any)')
@requireComponent(YJDynamicTexture)
export class Seti18n extends SetText {

    protected onDataChange(data: any) {
        if (typeof data == 'object') {
            for (let k in data) {
                let d = this.parse(data[k]);
                data[k] = YJi18n.ins.to(d.key, d.args);
            }
        }
        super.onDataChange(data);
    }

    private parse(v: string): { key: string, args?: string[] } {
        let a = v.split('|');
        if (a[1] == undefined) return { key: a[0] };
        return { key: a[0], args: a[1].split(',') }
    }
}
