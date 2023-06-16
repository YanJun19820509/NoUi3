
import { ccclass, property, menu, executeInEditMode, Label, RichText, EDITOR, BitmapFont } from '../yj';
import { YJBitmapFont } from '../engine/YJBitmapFont';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';

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
@executeInEditMode()
export class SetText extends FuckUi {

    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';

    protected label: Label | RichText | YJCharLabel;
    private newData: any;

    protected onDataChange(data: any) {
        this.newData = data;
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
        // if (!EDITOR) {
        //     let rect = this.node.getComponent(UITransform)?.getBoundingBoxToWorld();
        //     let viewSize = view.getVisibleSize();

        //     if (rect.xMax < 0 || rect.yMax < 0 || rect.xMin > viewSize.width || rect.yMin > viewSize.height) {
        //         this.scheduleOnce(() => {
        //             this.lateSet();
        //         });
        //         return;
        //     }
        // }
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


    /////////////EDITOR////////////
    update() {
        if (!EDITOR) return;
        let label = (this.node.getComponent(Label) && !this.node.getComponent(YJBitmapFont)) || this.node.getComponent(RichText);
        if (label && !this.getComponent(YJDynamicTexture)) this.addComponent(YJDynamicTexture);
        else if (!label && this.getComponent(YJDynamicTexture)) this.getComponent(YJDynamicTexture).destroy();
    }

    public a_setEmpty(): void {
        this.setLabel('');
    }
}
