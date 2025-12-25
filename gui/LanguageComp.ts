import { LangLabelParamsItem, LanguageLabel } from "@core/language/LanguageLabel";
import { ccclass, EDITOR, executeInEditMode, Label, property } from "@hackUi/yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Mon Dec 15 2025 15:01:43 GMT+0800 (中国标准时间)
 *
 */

@ccclass('LanguageComp')
@executeInEditMode()
export class LanguageComp extends LanguageLabel {
    get string(): string {
        return super.string || this.dataID;
    }

    @property
    key: string = '';

    update() {
        if (EDITOR) {
            const label = this.getComponent(Label);
            if (label && label.string != '' && label.string != this.key) {
                this.key = this.getComponent(Label).string;
            }
        }
    }

    onLoad() {
        if (EDITOR) return;
        if (this.key) this.dataID = this.key;
        super.onLoad();
    }

    public setLabel(data: any) {
        const { key, params } = data;
        this.dataID = this.keyToId(key);
        this.setParams(params);
    }

    /**
     * 找到key对应的翻译id
     * @param key 
     * @returns 
     */
    private keyToId(key: string) {
        return key;
    }

    private setParams(params: any) {
        if (params instanceof Array) {
            for (let i = 0, n = params.length; i < n; i++) {
                this.setVars(i.toString(), params[i].value);
            }
        } else if (params instanceof Object) {
            for (let key in params) {
                this.setVars(key, params[key]);
            }
        }
    }
}