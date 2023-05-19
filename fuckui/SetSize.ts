
import { _decorator, Component, Node } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetSize
 * DateTime = Mon Jan 17 2022 14:20:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSize.ts
 * FileBasenameNoExtension = SetSize
 * URL = db://assets/Script/NoUi3/fuckui/SetSize.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetSize')
@menu('NoUi/ui/SetSize(设置宽高:object)')
export class SetSize extends FuckUi {

    protected onDataChange(data: any) {
        let a = [];
        for (let k in data) {
            a.push(data[k]);
        }
        no.width(this.node, a[0]);
        no.height(this.node, a[1]);
    }
}
