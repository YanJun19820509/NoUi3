
import { ccclass, property, menu, Component, Node, Label } from '../yj';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { FuckUi } from './FuckUi';
import { no } from '../no';

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

    @property({ type: YJCharLabel, displayName: '显示红点数量', visible() { return this.isNumber; } })
    charLabel: YJCharLabel = null;

    onLoad() {
        super.onLoad();
        this.targetNode = this.targetNode || this.node;
    }

    protected onDataChange(data: any) {
        let v = Number(data);
        // this.targetNode.active = v > 0;
        no.visible(this.targetNode, v > 0);
        if (this.isNumber) {
            if (this.label != null)
                this.label.string = data;
            if (this.charLabel != null)
                this.charLabel.string = data;
        }
    }
}
