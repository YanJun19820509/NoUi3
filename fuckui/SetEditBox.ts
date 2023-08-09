
import { ccclass, requireComponent, menu, property, EDITOR, Node, EditBox } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { FuckUi } from './FuckUi';

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
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;
    @property
    public get bindEditiongDidEnded(): boolean {
        return false;
    }

    public set bindEditiongDidEnded(v: boolean) {
        // this.getComponent(EditBox).editingDidEnded = [no.createEventHandler(this.node, 'SetEditBox', 'onEditEnd')];
        // this.getComponent(EditBox).editingReturn = [no.createEventHandler(this.node, 'SetEditBox', 'onEditEnd')];
        this.getComponent(EditBox).textChanged = [no.createEventHandler(this.node, 'SetEditBox', 'onEditEnd')];
    }

    onLoad() {
        super.onLoad();
        if (EDITOR) {
            this.dataWork = no.getComponentInParents(this.node, YJDataWork);
            return;
        }

    }

    protected onDataChange(data: any) {
        if (typeof data == 'object') {
            for (let k in data) {
                if (data[k] == null) return;
            }
        }
        this.getComponent(EditBox).string = String(data);
    }

    private onEditEnd(editor: EditBox) {
        const v = editor.string;
        if (v == this.oldData) return;
        this.dataWork?.setValue(this.bind_keys, v);
    }
}
