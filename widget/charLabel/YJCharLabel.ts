
import { _decorator, Component, Node, UITransform, Layers, LabelOutline, Font, Layout, Color, Label, Texture2D, Vec2, v2, LabelShadow, instantiate } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { YJDynamicTexture } from '../../engine/YJDynamicTexture';
import { no } from '../../no';
const { ccclass, property, executeInEditMode, requireComponent } = _decorator;

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
@requireComponent(Layout)
@executeInEditMode()
export class YJCharLabel extends Component {
    @property(Color)
    color: Color = Color.WHITE.clone();
    @property
    text: string = '';
    @property
    fontSize: number = 22;
    @property(Font)
    font: Font = null;
    @property
    lineHeight: number = 22;
    @property
    letterSpacing: number = 0;
    @property
    italic: boolean = false;
    @property
    bold: boolean = false;
    @property
    outlineColor: Color = Color.BLACK.clone();
    @property
    outlineWidth: number = 2;
    @property
    shadowColor: Color = Color.BLACK.clone();
    @property
    shadowOffset: Vec2 = v2();
    @property
    shadowBlur: number = 0;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    private charPool: any = {};
    private usedCharNode: Node[] = [];

    onLoad() {
        if (!EDITOR) {
            return;
        }
        let layout = this.getComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
    }

    update() {
        if (!EDITOR) return;
        this.setLabel(this.text);
    }

    public set string(v: string) {
        this.setLabel(v);
    }

    public setLabel(s: string): void {
        let a = s.split('');
        if (EDITOR) {
            let labelNodes = this.node.children;
            labelNodes.forEach(child => {
                child.destroy();
            });
            for (let i = 0, n = a.length; i < n; i++) {
                this.createCharNode(a[i], i);
            }
        } else {
            for (let i = this.usedCharNode.length - 1; i >= 0; i--) {
                let v = this.usedCharNode[i].name;
                this.usedCharNode[i].active = false;
                if (!this.charPool[v]) this.charPool[v] = [];
                this.charPool[v][this.charPool[v].length] = this.usedCharNode[i];
            }
            this.usedCharNode = [];
            for (let i = 0, n = a.length; i < n; i++) {
                if (!this.charPool[a[i]]) this.charPool[a[i]] = [];
                let labelNode = this.charPool[a[i]].shift();
                if (!labelNode) {
                    labelNode = this.createCharNode(a[i], i);
                } else {
                    labelNode.setSiblingIndex(i);
                    labelNode.active = true;
                }
                this.usedCharNode[this.usedCharNode.length] = labelNode;
            }
        }
    }

    private createCharNode(v: string, siblingIndex: number): Node {
        let labelNode = new Node(v);
        labelNode.layer = Layers.Enum.UI_2D;
        labelNode.parent = this.node;
        labelNode.setSiblingIndex(siblingIndex);
        labelNode.addComponent(UITransform);
        let label = labelNode.addComponent(Label);
        label.customMaterial = this.dynamicAtlas?.commonMaterial;
        label.color = this.color;
        label.font = this.font;
        label.fontSize = this.fontSize;
        label.lineHeight = this.lineHeight;
        label.isItalic = this.italic;
        label.isBold = this.bold;
        label.cacheMode = Label.CacheMode.BITMAP;
        let outline = labelNode.addComponent(LabelOutline);
        outline.color = this.outlineColor;
        outline.width = this.outlineWidth;
        let shadow = labelNode.addComponent(LabelShadow);
        shadow.color = this.shadowColor;
        shadow.offset = this.shadowOffset;
        shadow.blur = this.shadowBlur;
        labelNode.addComponent(YJDynamicTexture).dynamicAtlas = this.dynamicAtlas;
        if (EDITOR) label.string = v;
        else
            labelNode.getComponent(YJDynamicTexture).packLabelFrame(v);
        return labelNode;
    }

    // private createSpriteFrame(v: string, label: Label) {
    //     if (v == '') {
    //         label['_ttfSpriteFrame'] = null;
    //         return;
    //     }
    //     if (!EDITOR) {
    //         let uuid = v + "_" + this.color + "_" + this.fontSize + "_" + this.font['_fontFamily'] + "_" + this.outlineColor + '_' + this.outlineWidth;
    //         let packedFrame = this.dynamicAtlas.getPackedFrame(uuid);
    //         if (!packedFrame) {
    //             label.string = v;
    //             label.ttfSpriteFrame.texture._uuid = uuid;
    //             packedFrame = this.dynamicAtlas.atlas?.drawTexture(label.ttfSpriteFrame.texture as Texture2D);
    //         }
    //         if (packedFrame) {
    //             label.ttfSpriteFrame._setDynamicAtlasFrame(packedFrame);
    //             if (label.spriteFrame) {
    //                 const renderData = label.renderData;
    //                 renderData.updateRenderData(label, label.spriteFrame);
    //             }
    //         }
    //     } else {
    //         label.string = v;
    //         // let img = this.createCharImage(v);
    //         // let texture = new DynamicAtlasTexture();
    //         // texture.initWithSize(img.width, img.height);
    //         // texture.drawImageAt(img, 0, 0);
    //         // newSf.texture = texture;
    //     }
    // }


    // private createCharImage(c: string): HTMLCanvasElement {
    //     this.label.string = c;
    //     let canvas = document.createElement('canvas');
    //     // canvas.width = this.label.;
    //     canvas.height = this.lineHeight;
    //     let ff = this.font?.['_fontFamily'] || '';
    //     let ctx = canvas.getContext("2d");
    //     ctx.font = `${this.italic ? 'italic' : ''} ${this.bold ? 'bold' : ''} ${this.fontSize}px ${ff}`;
    //     ctx.fillStyle = this.color.toCSS('#rrggbb');
    //     ctx.fillText(c, 0, canvas.height - this.outlineWidth * 2 - 2);
    //     if (this.outlineWidth > 0) {
    //         ctx.strokeStyle = this.outlineColor.toCSS('#rrggbb');
    //         ctx.strokeText(c, 0, canvas.height - this.outlineWidth * 2 - 2);
    //     }
    //     return canvas;
    // }
}
