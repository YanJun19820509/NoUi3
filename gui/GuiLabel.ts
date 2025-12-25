import { YJLabel } from "@hackUi/widget/charLabel/YJLabel";
import { ccclass, property } from "@hackUi/yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Mon Dec 15 2025 14:50:52 GMT+0800 (中国标准时间)
 *
 */

@ccclass('GuiLabel')
export class GuiLabel extends YJLabel {
    @property({ displayName: '多语言' })
    get isMultiLanguage(): boolean {
        return this._isMultiLanguage;
    }
    set isMultiLanguage(v: boolean) {
        this._isMultiLanguage = v;
        if (v) {
            this.addComponent('LanguageComp');
        } else {
            this.getComponent('LanguageComp')?.destroy();
        }
    }

    @property({ serializable: true })
    _isMultiLanguage: boolean = false;

    public removeLabel() {
        if (this.isMultiLanguage) {
            this.string = '';
            if (this.getComponent('SetGuiLabel')?.['bind_keys']) {
                this.getComponent('LanguageComp')['key'] = '';
            }
        }
    }

    public resetLabel() {
        if (this.isMultiLanguage) {
            this.string = this.getComponent('LanguageComp')['key'] || '';
        }
    }
}