
import { ccclass, property, menu, Label, RichText, EDITOR, BitmapFont, isValid } from '../yj';
import { YJBitmapFont } from '../widget/bmfont/YJBitmapFont';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
import { YJDynamicLoadFont } from '../base/YJDynamicLoadFont';

/**
 * Predefined variables
 * Name = SetText
 * DateTime = Mon Jan 17 2022 14:36:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetText.ts
 * FileBasenameNoExtension = SetText
 * URL = db://assets/Script/NoUi3/fuckui/SetText.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetText')
@menu('NoUi/ui/SetText(设置文本内容:string)')
export class SetText extends FuckUi {

    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';
    @property
    public get packToAtlas(): boolean {
        return this._packToAtlas;
    }

    public set packToAtlas(v: boolean) {
        if (v == this._packToAtlas) return;
        this._packToAtlas = v;
        if (v) {
            let label = (this.node.getComponent(Label) && !this.node.getComponent(YJBitmapFont)) || this.node.getComponent(RichText);
            if (label && !this.getComponent(YJDynamicTexture)) this.addComponent(YJDynamicTexture);
        } else {
            this.getComponent(YJDynamicTexture)?.destroy();
        }
    }

    @property({ serializable: true })
    _packToAtlas: boolean = true;

    protected label: Label | RichText | YJCharLabel;
    private newData: any;

    onLoad() {
        super.onLoad();
        if (!this.node.parent.getComponent('Layout')) {
            no.siblingIndex(this.node, this.node.parent.children.length - 1);
        }
    }

    protected onDataChange(data: any) {
        this.newData = data;
        if (this.getComponent(YJDynamicLoadFont))
            this.getComponent(YJDynamicLoadFont).loadFont().then(() => {
                this.lateSet();
            });
        else
            this.lateSet();
    }

    protected setLabel(data: any): void {
        if (this.label == null) return;
        let s = '';
        if (typeof data == 'string') {
            if (data != '')
                s = no.formatString(this.formatter, data.split('|'));
        } else if (typeof data == 'number') {
            s = no.formatString(this.formatter, { '0': data });
        } else {
            s = no.formatString(this.formatter, data);
        }
        if (EDITOR) {
            this.label.string = s;
            return;
        }
        if (this.label.string != s) {
            if (this.label instanceof Label) {
                let dt = this.getComponent(YJDynamicTexture);
                if (this.label.font instanceof BitmapFont)
                    this.label.string = s;
                else if (dt)
                    dt.packLabelFrame(s);
                else this.label.string = s;
            } else this.label.string = s;
            this.checkShader();
        }
    }

    private checkShader() {
        this.scheduleOnce(() => {
            this.getComponent(SetEffect)?.work();
        });
    }

    private lateSet(): void {
        if (!isValid(this.node)) return;
        let data = this.newData;
        if (typeof data == 'object') {
            for (let k in data) {
                if (data[k] == null) return;
            }
        }
        if (!this.label) {
            this.label = this.node.getComponent(Label) || this.node.getComponent(RichText) || this.node.getComponent(YJCharLabel);
        }
        this.setLabel(data);
    }

    public a_setEmpty(): void {
        this.setLabel('');
    }
}
