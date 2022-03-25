
import { _decorator, Component, Node, Label } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetHint
 * DateTime = Fri Jan 14 2022 18:03:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetHint.ts
 * FileBasenameNoExtension = SetHint
 * URL = db://assets/Script/NoUi3/fuckui/SetHint.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetHint')
@menu('NoUi/ui/SetHint(设置红点:number)')
export class SetHint extends FuckUi {

    @property({ displayName: '红点', type: Node })
    targetNode: Node = null;
    @property
    isNumber: boolean = true;

    @property({ type: Label, displayName: '显示红点数量', visible() { return this.isNumber; } })
    label: Label = null;

    onLoad() {
        super.onLoad();
        this.targetNode = this.targetNode || this.node;
    }

    protected onDataChange(data: any) {
        let v = Number(data);
        this.targetNode.active = v > 0;
        if (this.isNumber && this.label != null)
            this.label.string = data;
    }
}
