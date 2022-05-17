
import { _decorator, Component, Node, UITransform, Label, Layers, LabelOutline, LabelShadow } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { YJDynamicTexture } from '../../engine/YJDynamicTexture';
import { SetText } from '../../fuckui/SetText';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJCharLabel
 * DateTime = Fri May 06 2022 09:16:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCharLabel.ts
 * FileBasenameNoExtension = YJCharLabel
 * URL = db://assets/NoUi3/widget/charLabel/YJCharLabel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJCharLabel')
@executeInEditMode()
export class YJCharLabel extends Component {
    @property
    text: string = '';
    @property(Node)
    tempLabel: Node = null;
    @property(Node)
    container: Node = null;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    update() {
        if (!EDITOR) return;
        this.setLabel(this.text);
    }

    public set string(s: string) {
        this.setLabel(s);
    }

    public setLabel(s: string): void {
        if (!this.tempLabel || !this.container) return;
        let labelNodes = this.container.children;
        let a = s.split('');
        let n = Math.max(a.length, labelNodes.length);
        let tempLabelComp = this.tempLabel.getComponent(Label);
        let tempLabelOutlineComp = this.tempLabel.getComponent(LabelOutline);
        let tempLabelShadowComp = this.tempLabel.getComponent(LabelShadow);
        for (let i = 0; i < n; i++) {
            let labelNode = labelNodes[i];
            if (!labelNode) {
                labelNode = new Node('char');
                labelNode.layer = Layers.Enum.UI_2D;
                labelNode.parent = this.container;
                labelNode.addComponent(UITransform);
                let label = labelNode.addComponent(Label);
                label.color = tempLabelComp.color;
                label.fontSize = tempLabelComp.fontSize;
                label.lineHeight = tempLabelComp.lineHeight;
                label.font = tempLabelComp.font;
                labelNode.addComponent(SetText);
                let dt = labelNode.addComponent(YJDynamicTexture);
                dt.dynamicAtlas = this.dynamicAtlas;
                if (tempLabelOutlineComp) {
                    let ol = labelNode.addComponent(LabelOutline);
                    ol.color = tempLabelOutlineComp.color;
                    ol.width = tempLabelOutlineComp.width;
                }
                if (tempLabelShadowComp) {
                    let ls = labelNode.addComponent(LabelShadow);
                    ls.offset = tempLabelShadowComp.offset;
                    ls.blur = tempLabelShadowComp.blur;
                    ls.color = tempLabelShadowComp.color;
                }
            }
            if (a[i]) {
                labelNode.active = true;
                labelNode.getComponent(SetText).setData(JSON.stringify(a[i]));
            } else {
                if (EDITOR)
                    labelNode.destroy();
                else
                    labelNode.active = false;
            }
        }
    }

}
