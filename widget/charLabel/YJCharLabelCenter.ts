
import { _decorator, Component, Node, SpriteFrame, Label, Color, Font, v2, Vec2, LabelOutline, instantiate, LabelShadow, Layers, UITransform, math, assetManager } from 'cc';
import { DEBUG, EDITOR } from 'cc/env';
import { no } from '../../no';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJCharLabelCenter
 * DateTime = Fri Oct 21 2022 12:28:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCharLabelCenter.ts
 * FileBasenameNoExtension = YJCharLabelCenter
 * URL = db://assets/NoUi3/widget/charLabel/YJCharLabelCenter.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass("YJCharLabelStyle")
export class YJCharLabelStyle {
    @property(Color)
    color: Color = Color.WHITE.clone();
    @property
    fontSize: number = 22;
    @property(Font)
    font: Font = null;
    @property
    fontFamily: string = 'Arial';
    @property
    lineHeight: number = 22;
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

    public getUuid(str: string): string {
        return str + "_" + this.color + "_" + this.fontSize + "_" + (this.font?.name || this.fontFamily) + "_" + this.outlineColor + '_' + this.outlineWidth;
    }
}

@ccclass('YJCharLabelCenter')
@executeInEditMode()
export class YJCharLabelCenter extends Component {
    @property({ type: YJCharLabelStyle })
    labelStyles: YJCharLabelStyle[] = [];
    @property({ multiline: true, editorOnly: true })
    styleContent: string = '';
    @property({ editorOnly: true })
    pasteCharLabelStyle: boolean = false;

    public static ins: YJCharLabelCenter;

    private spriteFrameMap = {};

    update() {
        if (EDITOR) {
            if (this.pasteCharLabelStyle) {
                this.pasteCharLabelStyle = false;
                try {
                    let a = no.parse2Json(this.styleContent);
                    console.log(a);
                    if (a.font) {
                        assetManager.loadAny({ 'uuid': a.font, 'type': Font }, (err, item: Font) => {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                let ls = new YJCharLabelStyle();
                                ls.color = new math.Color(a.color);
                                ls.fontSize = a.fontSize;
                                ls.fontFamily = a.fontFamily;
                                ls.font = item;
                                ls.bold = a.bold;
                                ls.italic = a.italic;
                                ls.lineHeight = a.lineHeight;
                                ls.outlineColor = new math.Color(a.outlineColor);
                                ls.outlineWidth = a.outlineWidth;
                                ls.shadowColor = new math.Color(a.shadowColor);
                                ls.shadowBlur = a.shadowBlur;
                                ls.shadowOffset = math.v2(a.shadowOffset[0], a.shadowOffset[1]);
                                this.labelStyles[this.labelStyles.length] = ls;
                            }
                        });
                    }
                } catch (e) {console.error(e); }
            }
        }
    }

    onLoad() {
        if (EDITOR) return;
        YJCharLabelCenter.ins = this;
        if (DEBUG) window['YJCharLabelCenter'] = YJCharLabelCenter.ins;
    }

    onDestroy() {
        if (EDITOR) return;
        YJCharLabelCenter.ins = null;
    }

    public init() {
        let nodes: Node[] = [];
        for (let i = 0, n = this.labelStyles.length; i < n; i++) {
            const style = this.labelStyles[i];
            for (let j = 0; j < 10; j++) {
                const s = `${j}`;
                let labelNode = this.createCharNode(s, style);
                nodes[nodes.length] = labelNode;
                this._createSpriteFrame(labelNode, style.getUuid(s));
            }
        }

        this.scheduleOnce(() => {
            for (let i = nodes.length - 1; i >= 0; i--) {
                nodes[i].parent = null;
                nodes[i] = null;
            }
            nodes = null;
        });
    }

    public async getSpriteFrame(uuid: string): Promise<SpriteFrame | null> {
        if (this.spriteFrameMap[uuid] == 1)
            return new Promise<SpriteFrame | null>(resolve => {
                this.scheduleOnce(() => {
                    resolve(this.getSpriteFrame(uuid));
                });
            });

        let a: SpriteFrame = this.spriteFrameMap[uuid];
        if (a) return a.clone();
        return null;
    }

    public async createSpriteFrame(labelNode: Node, uuid: string): Promise<SpriteFrame> {
        this.spriteFrameMap[uuid] = 1;
        labelNode.parent = this.node;
        await no.sleep(0, this);
        let sf = labelNode.getComponent(Label).ttfSpriteFrame;
        sf._uuid = uuid;
        this.spriteFrameMap[uuid] = sf;
        labelNode.getComponent(Label)['_ttfSpriteFrame'] = null;
        this.scheduleOnce(() => {
            labelNode.parent = null;
            labelNode = null;
        });
        return this.getSpriteFrame(uuid);
    }

    private _createSpriteFrame(labelNode: Node, uuid: string): void {
        labelNode.parent = this.node;
        let sf = labelNode.getComponent(Label).ttfSpriteFrame;
        sf._uuid = uuid;
        this.spriteFrameMap[uuid] = sf;
        labelNode.getComponent(Label)['_ttfSpriteFrame'] = null;
    }

    private createCharNode(v: string, style: YJCharLabelStyle): Node {
        let labelNode: Node = new Node();
        labelNode.layer = Layers.Enum.UI_2D;
        labelNode.addComponent(UITransform).setContentSize(10, 10);
        let label = labelNode.addComponent(Label);
        label.string = '';
        label.color = style.color;
        label.fontFamily = style.fontFamily;
        label.font = style.font;
        label.fontSize = style.fontSize;
        label.lineHeight = style.lineHeight;
        label.isItalic = style.italic;
        label.isBold = style.bold;
        label.cacheMode = Label.CacheMode.NONE;
        if (style.outlineWidth > 0) {
            let outline = labelNode.addComponent(LabelOutline);
            outline.color = style.outlineColor;
            outline.width = style.outlineWidth;
        }
        if (style.shadowBlur != 0) {
            let shadow = labelNode.addComponent(LabelShadow);
            shadow.color = style.shadowColor;
            shadow.offset = style.shadowOffset;
            shadow.blur = style.shadowBlur;
        }
        label.string = v;
        return labelNode;
    }
}