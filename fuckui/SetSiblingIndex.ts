import { no } from '../no';
import { ccclass, menu, property, Enum } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetSiblingIndex
 * DateTime = Mon Jan 17 2022 14:19:53 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSiblingIndex.ts
 * FileBasenameNoExtension = SetSiblingIndex
 * URL = db://assets/Script/NoUi3/fuckui/SetSiblingIndex.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

export enum SiblingType {
    None = 0,
    Top,
    Bottom
}

@ccclass('SetSiblingIndex')
@menu('NoUi/ui/SetSiblingIndex(设置同级节点索引:number)')
export class SetSiblingIndex extends FuckUi {
    @property({ type: Enum(SiblingType), displayName: '方式' })
    type: SiblingType = SiblingType.None;

    protected onDataChange(data: any) {
        switch (this.type) {
            case SiblingType.None:
                no.siblingIndex(this.node, Number(data));
                break;
            case SiblingType.Top:
                if (Boolean(data)) no.siblingIndex(this.node, this.node.parent.children.length - 1);
                break;
            case SiblingType.Bottom:
                if (Boolean(data)) no.siblingIndex(this.node, 0);
                break;
        }
    }
}
