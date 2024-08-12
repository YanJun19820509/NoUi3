import { no } from "../../no";
import { ccclass, Component, EditBox, property, Toggle } from "../../yj";

/**
 * 本地缓存组件
 * 支持单选框和输入框
 * onLoad时将读取本地缓存并赋值
 * onChange时将值写入本地缓存
 */
@ccclass('YJLocalStorage')
export class YJLocalStorage extends Component {
    @property({ displayName: '缓存数据的key', tooltip: '不支持多key' })
    key: string = '';
    @property({ displayName: '是否业务缓存', tooltip: '业务缓存会与账号绑定' })
    usePreKey: boolean = true;
    @property({ displayName: '是否单选框', visible() { return !this.isEditorBox; } })
    isToggle: boolean = false;
    @property({ displayName: '是否输入框', visible() { return !this.isToggle; } })
    isEditorBox: boolean = false;
    @property({ type: EditBox, visible() { return this.isEditorBox; } })
    editBox: EditBox = null;
    @property({ type: Toggle, visible() { return this.isToggle; } })
    toggle: Toggle = null;
    @property({ displayName: '绑定' })
    public get bind(): boolean {
        return false;
    }

    public set bind(v: boolean) {
        if (this.toggle) {
            this.toggle.checkEvents.push(no.createClickEvent(this.node, YJLocalStorage, 'onChange'));
        } else if (this.editBox) {
            this.editBox.textChanged.push(no.createClickEvent(this.node, YJLocalStorage, 'onChange'));
        }
    }


    onLoad() {
        if (!this.key) return;
        const v = this.usePreKey ? no.dataCache.getLocal(this.key) : localStorage.getItem(this.key);
        if (v == null) return;
        if (this.isToggle) {
            this.toggle.isChecked = v == 'true';
        } else if (this.isEditorBox) {
            this.editBox.string = v;
        }
    }

    private onChange() {
        if (this.key) {
            if (this.isToggle) {
                this.usePreKey ? no.dataCache.setLocal(this.key, this.toggle.isChecked) : localStorage.setItem(this.key, this.toggle.isChecked.toString());
            } else if (this.isEditorBox) {
                this.usePreKey ? no.dataCache.setLocal(this.key, this.editBox.string) : localStorage.setItem(this.key, this.editBox.string);
            }
        }
    }
}


