
import { _decorator, Component, Node, UITransform, Layers, LabelOutline, Font, Layout, Color, Label, Vec2, v2, LabelShadow, Sprite, UIOpacity, Enum, SpriteFrame } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicAtlas } from '../../engine/YJDynamicAtlas';
import { no } from '../../no';
import { YJCharLabelCenter } from './YJCharLabelCenter';
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

enum YJCharLabelMode {
    Char = 0,
    String
}

@ccclass('YJCharLabel')
@executeInEditMode()
export class YJCharLabel extends Component {
    @property({ type: Enum(YJCharLabelMode) })
    mode: YJCharLabelMode = YJCharLabelMode.Char;
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
    @property({ tooltip: '当整体宽度超过maxWidth时将会等比缩小,如果设置为0则不做限制', visible() { return this.mode == YJCharLabelMode.Char; } })
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
    private _fs: number = 0;

    onLoad() {
        if (!EDITOR) {
            if (this.mode == YJCharLabelMode.String)
                this.addComponent(Sprite);
            return;
        }
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
    }

    update() {
        if (!EDITOR) return;
        if (this.text != this._text)
            this.setLabel(this.text);
        if (this.mode == YJCharLabelMode.String) {
            this.getComponent(Layout)?.destroy();
            !this.getComponent(Sprite) && this.addComponent(Sprite);
        } else if (this.mode == YJCharLabelMode.Char) {
            if (!this.getComponent(Layout)) {
                let layout = this.addComponent(Layout);
                layout.type = Layout.Type.HORIZONTAL;
                layout.resizeMode = Layout.ResizeMode.CONTAINER;
                this._fs = 0;
            }
            this.getComponent(Sprite)?.destroy();
        }
        if (this.mode == YJCharLabelMode.Char && this._fs != this.fontSize) {
            this._fs = this.fontSize;
            this.getComponent(Layout).spacingX = -this.fontSize / 4;
        }
    }

    public set string(v: string) {
        this.setLabel(`${v}`);
    }

    public setLabel(s: string): void {
        this._text = s;
        switch (this.mode) {
            case YJCharLabelMode.Char:
                this.setChars(s);
                break;
            case YJCharLabelMode.String:
                this.setString(s);
                break;
        }
    }

    private setChars(s: string) {
        let a = s.split('');
        let labelNodes = this.node.children;
        if (EDITOR) {
            labelNodes.forEach(child => {
                child.destroy();
            });
            for (let i = 0, n = a.length; i < n; i++) {
                this.createCharNode(a[i]).parent = this.node;
            }
        } else {
            // for (let i = this.usedCharNode.length - 1; i >= 0; i--) {
            //     let v = this.usedCharNode[i].name;
            //     this.usedCharNode[i].active = false;
            //     this.usedCharNode['__order'] = 99;
            //     if (!this.charPool[v]) this.charPool[v] = [];
            //     this.charPool[v][this.charPool[v].length] = this.usedCharNode[i];
            // }
            // this.usedCharNode = [];
            // for (let i = 0, n = a.length; i < n; i++) {
            //     if (!this.charPool[a[i]]) this.charPool[a[i]] = [];
            //     let labelNode: Node = this.charPool[a[i]].shift();
            //     if (!labelNode) {
            //         labelNode = this.createCharNode(a[i]);
            //     } else {
            //         labelNode.active = true;
            //     }
            //     labelNode['__order'] = i;
            //     this.usedCharNode[this.usedCharNode.length] = labelNode;
            // }
            // this.node.children.sort((a, b) => {
            //     return a['__order'] - b['__order'];
            // });
            // this.node._updateSiblingIndex();
            for (let i = 0; i < a.length; i++) {
                let labelNode = labelNodes[i];
                if (!labelNode) {
                    labelNode = this.createSpriteNode(a[i]);
                } else labelNode.active = true;
                this.setSpriteFrame(labelNode, a[i]);
            }
            for (let i = a.length, n = labelNodes.length; i < n; i++) {
                labelNodes[i].active = false;
            }

            this.scheduleOnce(() => {
                this.setScale();
            }, .1);
        }
    }

    private async setString(s: string) {
        this.node.removeAllChildren();
        if (s == '') return;
        await this.setSpriteFrame(this.node, s);
        this.scheduleOnce(() => {
            this.setScale();
        });
    }

    private async getSpriteFrame(v: string): Promise<SpriteFrame> {
        let uuid = this.getUuid(v);
        let sf = this.dynamicAtlas?.getSpriteFrameInstance(uuid);
        if (sf) return sf;
        sf = await YJCharLabelCenter.ins.getSpriteFrame(uuid);
        if (!sf)
            sf = await YJCharLabelCenter.ins.createSpriteFrame(this.createCharNode(v), uuid);
        sf._uuid = uuid;
        return this.dynamicAtlas?.packSpriteFrame(sf);
    }

    private async setSpriteFrame(node: Node, v: string) {
        let spriteFrame = await this.getSpriteFrame(v);
        node.getComponent(Sprite).spriteFrame = spriteFrame;
    }

    private createCharNode(v: string): Node {
        let labelNode = new Node();
        labelNode.layer = Layers.Enum.UI_2D;
        labelNode.addComponent(UITransform).setContentSize(10, 10);
        // this.charModels[v] = labelNode;
        let label = labelNode.addComponent(Label);
        // if (this.dynamicAtlas?.commonMaterial)
        //     label.customMaterial = this.dynamicAtlas?.commonMaterial;
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
        // labelNode.addComponent(YJDynamicTexture).dynamicAtlas = this.dynamicAtlas;
        // labelNode.addComponent(UIOpacity);
        label.string = v;
        // else
        //     labelNode.getComponent(YJDynamicTexture).packLabelFrame(v);
        // labelNode.parent = this.node;
        return labelNode;
    }

    private createSpriteNode(v: string): Node {
        let labelNode = new Node();
        labelNode.layer = Layers.Enum.UI_2D;
        labelNode.addComponent(UITransform).setContentSize(10, 10);
        let s = labelNode.addComponent(Sprite);
        s.sizeMode = Sprite.SizeMode.TRIMMED;
        if (this.dynamicAtlas?.commonMaterial)
            s.customMaterial = this.dynamicAtlas?.commonMaterial;
        labelNode.active = true;
        labelNode.parent = this.node;
        labelNode.addComponent(UIOpacity);
        // this.charModels[v] = labelNode;
        return labelNode;
    }

    private setScale() {
        if (this.maxWidth == 0) return;
        this.getComponent(Layout).updateLayout();
        let ut = this.getComponent(UITransform);
        if (ut.width <= this.maxWidth)
            this.node.setScale(1, 1);
        else {
            let s = this.maxWidth / ut.width;
            this.node.setScale(s, s);
        }
    }

    private getUuid(str: string): string {
        let a = str + "_" + this.color + "_" + this.fontSize + "_" + (this.font?.name || this.fontFamily) + "_" + this.outlineColor + '_' + this.outlineWidth;
        return a;
    }
}
