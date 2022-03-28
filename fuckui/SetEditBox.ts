
import { _decorator, Component, Node, EditBox } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, requireComponent, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetEditBox
 * DateTime = Mon Mar 28 2022 16:39:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetEditBox.ts
 * FileBasenameNoExtension = SetEditBox
 * URL = db://assets/NoUi3/fuckui/SetEditBox.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetEditBox')
@requireComponent(EditBox)
@menu('NoUi/ui/SetEditBox(设置输入框内容:string)')
export class SetEditBox extends FuckUi {
    protected onDataChange(data: any) {
        if (typeof data == 'object') {
            for (let k in data) {
                if (data[k] == null) return;
            }
        }
        this.getComponent(EditBox).string = String(data);
    }
}
