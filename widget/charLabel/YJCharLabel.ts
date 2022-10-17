
import { _decorator, Component, Node, UITransform, Layers, LabelOutline, Font, Layout, Color, Label, Vec2, v2, LabelShadow, instantiate, Sprite, Renderable2D, UIOpacity, SpriteFrame, rect } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { YJDynamicTexture } from '../../engine/YJDynamicTexture';
import { no } from '../../no';
import { PackedFrameData } from '../../types';
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
    fontFamily: string = 'Arial';
    @property
    lineHeight: number = 22;
    @property
    letterSpacing: number = 0;
    @property({ tooltip: '当整体宽度超过maxWidth时将会等比缩小,如果设置为0则不做限制' })
    maxWidth: number = 0;
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

    private _text: string;
    private charPool: any = {};
    private usedCharNode: Node[] = [];
    private charModels: any = {};

    onLoad() {
        if (!EDITOR) {
            return;
        }
        let layout = this.getComponent(Layout);
        if (layout.type == Layout.Type.NONE) {
            layout.type = Layout.Type.HORIZONTAL;
            layout.resizeMode = Layout.ResizeMode.CONTAINER;
        }
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
    }

    update() {
        if (!EDITOR) return;
        if (this.text != this._text)
            this.setLabel(this.text);
    }

    public set string(v: string) {
        this.setLabel(`${v}`);
    }

    public setLabel(s: string): void {
        this._text = s;
        let a = s.split('');
        if (EDITOR) {
            let labelNodes = this.node.children;
            labelNodes.forEach(child => {
                child.destroy();
            });
            for (let i = 0, n = a.length; i < n; i++) {
                this.createCharNode(a[i]);
            }
        } else {
            for (let i = this.usedCharNode.length - 1; i >= 0; i--) {
                let v = this.usedCharNode[i].name;
                this.usedCharNode[i].active = false;
                this.usedCharNode['__order'] = 99;
                if (!this.charPool[v]) this.charPool[v] = [];
                this.charPool[v][this.charPool[v].length] = this.usedCharNode[i];
            }
            this.usedCharNode = [];
            for (let i = 0, n = a.length; i < n; i++) {
                if (!this.charPool[a[i]]) this.charPool[a[i]] = [];
                let labelNode: Node = this.charPool[a[i]].shift();
                if (!labelNode) {
                    labelNode = this.createCharNode(a[i]);
                } else {
                    labelNode.active = true;
                }
                labelNode['__order'] = i;
                this.usedCharNode[this.usedCharNode.length] = labelNode;
            }
            this.node.children.sort((a, b) => {
                return a['__order'] - b['__order'];
            });
            this.node._updateSiblingIndex();
        }
        this.scheduleOnce(() => {
            this.setScale();
        });
    }

    private createCharNode(v: string): Node {
        // if (this.charModels[v] && this.charModels[v].getComponent(Renderable2D).spriteFrame.original) {
        //     let node = this.clone(this.charModels[v]);
        //     return node;
        // }
        let uuid = this.createLabelFrameUuid(v);
        let frame = this.dynamicAtlas?.getPackedFrame(uuid);
        if (frame) {
            return this.createSpriteNode(v, uuid, frame);
        }
        let labelNode = new Node(v);
        labelNode.layer = Layers.Enum.UI_2D;
        labelNode.addComponent(UITransform);
        this.charModels[v] = labelNode;
        let label = labelNode.addComponent(Label);
        if (this.dynamicAtlas?.commonMaterial)
            label.customMaterial = this.dynamicAtlas?.commonMaterial;
        label.color = this.color;
        label.fontFamily = this.fontFamily;
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
        labelNode.addComponent(UIOpacity);
        if (EDITOR) label.string = v;
        else
            labelNode.getComponent(YJDynamicTexture).packLabelFrame(v);
        labelNode.parent = this.node;
        return labelNode;
    }

    // private clone(temp: Node): Node {
    //     if (temp.getComponent(Label)) {
    //         let labelNode = new Node(temp.name);
    //         labelNode.layer = Layers.Enum.UI_2D;
    //         let ut = labelNode.addComponent(UITransform);
    //         let s = labelNode.addComponent(Sprite);
    //         if (this.dynamicAtlas?.commonMaterial)
    //             s.customMaterial = this.dynamicAtlas?.commonMaterial;
    //         s.spriteFrame = temp.getComponent(Label).ttfSpriteFrame;
    //         ut.setContentSize(s.spriteFrame.rect.size);
    //         labelNode.active = true;
    //         labelNode.parent = this.node;
    //         labelNode.addComponent(UIOpacity);
    //         this.charModels[temp.name] = labelNode;
    //         return labelNode;
    //     } else {
    //         let labelNode = instantiate(temp);
    //         labelNode.parent = this.node;
    //         labelNode.active = true;
    //         return labelNode;
    //     }
    // }

    private createSpriteNode(name: string, uuid: string, frame: PackedFrameData): Node {
        let labelNode = new Node(name);
        labelNode.layer = Layers.Enum.UI_2D;
        let ut = labelNode.addComponent(UITransform);
        let s = labelNode.addComponent(Sprite);
        if (this.dynamicAtlas?.commonMaterial)
            s.customMaterial = this.dynamicAtlas?.commonMaterial;
        s.spriteFrame = new SpriteFrame();
        s.spriteFrame._uuid = uuid;
        s.spriteFrame.rotated = frame.rotate;
        s.spriteFrame.rect = rect(0, 0, frame.w, frame.h);
        // s.spriteFrame.offset = v2(frame.x, frame.y);
        s.spriteFrame._setDynamicAtlasFrame(frame);
        ut.setContentSize(frame.w, frame.h);
        labelNode.active = true;
        labelNode.parent = this.node;
        labelNode.addComponent(UIOpacity);
        this.charModels[name] = labelNode;
        return labelNode;
    }

    private setScale() {
        if (this.maxWidth == 0) return;
        let ut = this.getComponent(UITransform);
        if (ut.width <= this.maxWidth)
            this.node.setScale(1, 1);
        else {
            let s = this.maxWidth / ut.width;
            this.node.setScale(s, s);
        }
    }

    private createLabelFrameUuid(str: string): string {
        let a = str + "_" + this.color + "_" + this.fontSize + "_" + (this.font?.name || this.fontFamily) + "_" + this.outlineColor + '_' + this.outlineWidth;
        return a;
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
