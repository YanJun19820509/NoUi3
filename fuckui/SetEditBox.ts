
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
    @property({ displayName: '字节最大长度', step: 1, min: 0 })
    maxLen: number = 50;
    @property({ displayName: '中文算2个字节长度', visible() { return this.maxLen > 0; } })
    chinese2: boolean = true;
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

    private onEditEnd(v: string) {
        if (this.maxLen > 0) {
            let v1 = no.cutString(v, this.maxLen, this.chinese2);
            if (v != v1) {
                v = v1;
                this.scheduleOnce(() => {
                    this.setData(JSON.stringify(v));
                });
            }
        }
        this.dataWork?.setValue(this.bind_keys, v);
    }
}
