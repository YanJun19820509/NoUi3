
import { _decorator, Component, Node, UITransform, Layers, LabelOutline, Font, Layout, Color, Label, Vec2, v2, LabelShadow, Sprite, UIOpacity, Enum, SpriteFrame, instantiate, isValid } from 'cc';
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

    @property
    logStypeInfo: boolean = false;

    private _text: string;
    private _needInitMode: boolean = true;
    private _ing: boolean = false;

    onLoad() {
        if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);

        if (this.maxWidth != 0) {
            this.node.on(Node.EventType.SIZE_CHANGED, this.onNodeSizeChange, this);
        }
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
        this.node.targetOff(this);
    }

    update() {
        if (!EDITOR) return;
        if (this.logStypeInfo) {
            this.logStypeInfo = false;
            let a = {
                color: this.color.toHEX('#rrggbb'),
                fontSize: this.fontSize,
                font: this.font?._uuid,
                fontFamily: this.fontFamily,
                lineHeight: this.lineHeight,
                italic: this.italic,
                bold: this.bold,
                outlineColor: this.outlineColor.toHEX('#rrggbb'),
                outlineWidth: this.outlineWidth,
                shadowColor: this.shadowColor.toHEX('#rrggbb'),
                shadowOffset: [this.shadowOffset.x, this.shadowOffset.y],
                shadowBlur: this.shadowBlur
            };
            console.log('YJCharLabelStyle--', { info: JSON.stringify(a) });
        }
        this.initMode();
        if (this.text != this._text)
            this.setLabel(this.text);
    }

    private initMode() {
        if (this.mode == YJCharLabelMode.String) {
            if (!this.getComponent(Layout)) {
                let layout = this.addComponent(Layout);
                layout.type = Layout.Type.HORIZONTAL;
                layout.resizeMode = Layout.ResizeMode.CONTAINER;
            }
            if (!this.getComponent(Sprite)) {
                this.addComponent(Sprite);
                this._text = null;
            }
        } else if (this.mode == YJCharLabelMode.Char) {
            if (!this.getComponent(Layout)) {
                let layout = this.addComponent(Layout);
                layout.type = Layout.Type.HORIZONTAL;
                layout.resizeMode = Layout.ResizeMode.CONTAINER;
                this.getComponent(Sprite)?.destroy();
                let sp = this.italic ? -this.fontSize / 5 : 0;
                let s = this.getComponent(Layout).spacingX;
                if (s != sp) {
                    this.getComponent(Layout).spacingX = sp;
                }
                this._text = null;
            }
        }
    }

    public set string(v: string) {
        // if (this._needInitMode) {
        //     if (!this.getComponent('SetTimeCountDown')) this.mode = YJCharLabelMode.String;
        //     this._needInitMode = false;
        //     this.initMode();
        // }
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

    private async setChars(s: string) {
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
            // this.unscheduleAllCallbacks();
            // let i = 0, n = a.length;
            // this.schedule(() => {
            //     let labelNode = labelNodes[i];
            //     if (!labelNode) {
            //         labelNode = this.createSpriteNode(a[i]);
            //     } else labelNode.active = true;
            //     this.setSpriteFrame(labelNode, a[i]);
            //     i++;
            //     if (i == n) {
            //         for (n = labelNodes.length; i < n; i++) {
            //             labelNodes[i].active = false;
            //         }

            //         this.scheduleOnce(() => {
            //             this.setScale();
            //         }, .1);
            //     }
            // }, 1 / 60, n - 1);
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

            // this.scheduleOnce(() => {
            //     this.setScale();
            // }, 0.05);
        }
    }

    private async setString(s: string) {
        this.node.removeAllChildren();
        if (!this.node.getComponent(Sprite)) this.node.addComponent(Sprite);
        if (s == '') {
            this.node.getComponent(Sprite).spriteFrame = null;
            this.getComponent(UITransform).width = 0;
            return;
        }
        await this.setSpriteFrame(this.node, s);
        // this.scheduleOnce(() => {
        //     this.setScale();
        // });
    }

    private async getSpriteFrame(v: string): Promise<SpriteFrame> {
        let uuid = this.getUuid(v);
        let sf = this.dynamicAtlas?.getSpriteFrameInstance(uuid);
        if (sf) return sf;
        sf = await YJCharLabelCenter.ins.getSpriteFrame(uuid);
        if (!this?.node?.isValid) return;
        if (!sf)
            sf = await YJCharLabelCenter.ins.createSpriteFrame(this.createCharNode(v), uuid);
        if (!this?.node?.isValid) return;
        sf._uuid = uuid;
        return this.dynamicAtlas?.packSpriteFrame(sf) || sf;
    }

    private async setSpriteFrame(node: Node, v: string) {
        let spriteFrame = await this.getSpriteFrame(v);
        if (!this?.node?.isValid) return;
        if (node.isValid)
            (node.getComponent(Sprite) || node.addComponent(Sprite)).spriteFrame = spriteFrame;
    }

    private _tempCharNode: Node;
    private createCharNode(v: string): Node {
        let labelNode: Node;
        if (!EDITOR && this._tempCharNode) {
            labelNode = instantiate(this._tempCharNode);
        } else {
            labelNode = new Node();
            labelNode.layer = Layers.Enum.UI_2D;
            labelNode.addComponent(UITransform).setContentSize(10, 10);
            let label = labelNode.addComponent(Label);
            label.string = '';
            label.color = this.color;
            label.fontFamily = this.fontFamily;
            label.font = this.font;
            label.fontSize = this.fontSize;
            label.lineHeight = this.lineHeight;
            label.isItalic = this.italic;
            label.isBold = this.bold;
            label.cacheMode = Label.CacheMode.NONE;
            if (this.outlineWidth > 0) {
                let outline = labelNode.addComponent(LabelOutline);
                outline.color = this.outlineColor;
                outline.width = this.outlineWidth;
            }
            if (this.shadowBlur != 0) {
                let shadow = labelNode.addComponent(LabelShadow);
                shadow.color = this.shadowColor;
                shadow.offset = this.shadowOffset;
                shadow.blur = this.shadowBlur;
            }
            this._tempCharNode = instantiate(labelNode);
        }
        labelNode.getComponent(Label).string = v;
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
        return labelNode;
    }

    private setScale() {
        // no.log('setScale===============>')
        if (this.maxWidth == 0) return;
        if (!isValid(this)) return;
        this.getComponent(Layout).updateLayout();
        let ut = this.getComponent(UITransform);
        if (ut.width <= this.maxWidth)
            this.node.setScale(1, 1);
        else {
            let s = this.maxWidth / ut.width;
            this.node.setScale(s, s);
        }
    }

    private onNodeSizeChange() {
        if (this._ing) return;
        this._ing = true;
        this.scheduleOnce(() => {
            this._ing = false;
            this.setScale();
        }, 0.1);
    }

    private getUuid(str: string): string {
        let a = str + "_" + this.color + "_" + this.fontSize + "_" + (this.font?.name || this.fontFamily) + "_" + this.outlineColor + '_' + this.outlineWidth;
        return a;
    }
}
