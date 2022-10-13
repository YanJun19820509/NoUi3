
import { _decorator, Component, Node, JsonAsset, UITransform, Sprite, SpriteAtlas, Label, Size, Layers, Widget, HorizontalTextAlignment, Overflow, Button, ProgressBar, Layout, __private, v3, ToggleContainer, Toggle, ScrollView, Mask, Slider, LabelOutline, Vec2, LabelShadow } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { YJLoadAssets } from './YJLoadAssets';
import { YJReleasePrefab } from '../base/node/YJReleasePrefab';
import { YJButton } from '../fix/YJButton';
import { SetProgress } from '../fuckui/SetProgress';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { SetText } from '../fuckui/SetText';
import { YJToggleGroupManager } from '../base/node/YJToggleGroupManager';
import { SetList } from '../fuckui/SetList';
import { SetSliderProgress } from '../fuckui/SetSliderProgress';
const { ccclass, property, menu, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = AutoCreateNode
 * DateTime = Thu Mar 10 2022 10:32:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = AutoCreateNode.ts
 * FileBasenameNoExtension = AutoCreateNode
 * URL = db://assets/NoUi3/editor/AutoCreateNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('AutoCreateNode')
@menu('NoUi/editor/AutoCreateNode(自动创建节点)')
@executeInEditMode(true)
export class AutoCreateNode extends Component {

    private atlas: SpriteAtlas;
    private nameMap: any;
    private parent: Node;
    private rootPath: string;

    onEnable() {
        if (EDITOR) {
            this.loadConfigFile();
        }
    }

    private async loadConfigFile() {
        try {
            this.nameMap = {};
            let name = this.node.name;
            let a = await Editor.Dialog.select({
                path: Editor.Project.path + '\\assets',
                multi: false,
                type: 'directory'
            });
            if (!a.canceled) {
                let path = a.filePaths[0];
                console.log(path);
                path = path.replace(/\\/g, '/');
                // console.log(path);
                let root = Editor.Project.path.replace(/\\/g, '/');
                // console.log(root);
                let dest = path.replace(root + '/', 'db://');
                this.rootPath = dest;
                // console.log(dest);
                no.assetBundleManager.loadFileInEditorMode<SpriteAtlas>(dest + `/${name}.plist`, SpriteAtlas, (s, info) => {
                    this.atlas = s;
                    let atlasManager = this.getComponent(YJLoadAssets) || this.addComponent(YJLoadAssets);
                    atlasManager?.addAtlasUuid(info.uuid);
                    // console.log(s);
                    this.loadJson(dest, name);
                }, () => {
                    this.loadJson(dest, name);
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    private loadJson(dest: string, name: string) {
        // console.log('loadjson');
        no.assetBundleManager.loadFileInEditorMode<JsonAsset>(dest + `/${name}.json`, JsonAsset, f => {
            // console.log(f.json);
            this.createNodes(f.json);
            this.deleteConfigFile(dest + `/${name}.json`);
        }, () => {
            this.enabled = false;
        });
    }

    private createNodes(config: any) {
        try {
            // console.log('createNodes', config);
            let size = new Size(config.width, config.height);
            let da = this.node.getComponent(YJDynamicAtlas) || this.node.addComponent(YJDynamicAtlas);
            da.width = 512;
            da.height = 512;
            this.node.getComponent(UITransform).setContentSize(size);
            if (!this.node.getComponent(YJReleasePrefab))
                this.node.addComponent(YJReleasePrefab);
            this.parent = this.node.getChildByName('Canvas') || this.node;
            if (!this.node.getComponent(Widget)) {
                let widget = this.node.addComponent(Widget);
                widget.isAlignTop = true;
                widget.isAlignBottom = true;
                widget.isAlignLeft = true;
                widget.isAlignRight = true;
                widget.top = 0;
                widget.bottom = 0;
                widget.left = 0;
                widget.right = 0;
            }
            config.nodes.forEach((n: any) => {
                n.x = n.x - size.width / 2;
                n.y = size.height / 2 - n.y;
                this.parseType(n, this.parent);
            });
        } catch (e) {
            console.log(e);
        }
    }

    private parseType(n: any, parent: Node) {
        switch (n.type) {
            case 'label':
                this.createLabelNode(n, parent);
                break;
            case 'sprite':
                this.createSpriteNode(n, parent);
                break;
            case 'button':
                this.createButton(n, parent);
                break;
            case 'progress':
                this.createProgress(n, parent);
                break;
            case 'char':
                this.createLabelNode(n, parent);
                // this.createChar(n, parent);
                break;
            case 'toggleGroup':
                this.createToggleGroup(n, parent);
                break;
            case 'toggle':
                this.createToggle(n, parent);
                break;
            case 'list':
                this.createList(n, parent);
                break;
            case 'item':
                this.createItem(n, parent);
                break;
            case 'scrollView':
                this.createScrollView(n, parent);
                break;
            case 'slider':
                this.createSlider(n, parent);
                break;
            case 'layout':
                this.createLayout(n, parent);
                break;
        }
    }

    private parseChildren(c: any, parent: Node) {
        c.children.forEach((child: any) => {
            this.parseType(child, parent);
        });
    }

    private createSpriteNode(c: any, parent: Node): Node {
        let n = this.getNode(c.name, Sprite, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent);
        let s = n.getComponent(Sprite) || n.addComponent(Sprite);
        s.sizeMode = Sprite.SizeMode.CUSTOM;
        s.spriteFrame = this.atlas?.getSpriteFrame(c.name);
        if (s.spriteFrame)
            s.spriteAtlas = this.atlas;
        else {
            no.assetBundleManager.loadSpriteFrameInEditorMode(`${this.rootPath}/${c.name}.png`, (f, info) => {
                this.getComponent(YJLoadAssets)?.addSpriteFrameUuid(info.uuid);
                s.spriteFrame = f;
            }, () => {
                no.assetBundleManager.loadSpriteFrameInEditorMode(`db://assets/resources/texture_c/${c.name}.png`, (f, info) => {
                    this.getComponent(YJLoadAssets)?.addSpriteFrameUuid(info.uuid);
                    s.spriteFrame = f;
                }, () => {
                    n.addComponent('SetDynamicSpriteFrame');
                });
            });
        }
        if (c['9']) {
            s.type = Sprite.Type.SLICED;
        }
        return n;
    }

    private createLabelNode(c: any, parent: Node): Node {
        let n = this.getNode(c.name, Label, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent);
        if (!n.getComponent('fixedLab')) {
            let t: string = c.text;
            for (let i = 0, m = t.length; i < m; i++) {
                let code = t.charCodeAt(i);
                if (code >= 0x4e00 && code <= 0x29fa5) {
                    n.addComponent('fixedLab')['textId'] = c.text;
                    break;
                }
            }
        }
        if (n.getComponent('fixedLab')) {
            let l = n.getComponent(Label) || n.addComponent(Label);
            l.string = c.text;
            l.fontSize = Number(c.size);
            l.lineHeight = l.fontSize;
            l.color = no.str2Color(c.textColor);
            l.isBold = c.bold;
            l.isItalic = c.italic;
            l.horizontalAlign = c.justification == 'right' ? HorizontalTextAlignment.RIGHT : (c.justification == 'center' ? HorizontalTextAlignment.CENTER : HorizontalTextAlignment.LEFT);
            if (c.direction == 'vertical') {
                l.overflow = Overflow.RESIZE_HEIGHT;
            }
            if (c.outline != '') {
                let info = c.outline.split('|');
                let ol = n.getComponent(LabelOutline) || n.addComponent(LabelOutline);
                ol.color = no.str2Color(info[0]);
                ol.width = Number(info[1]);
            }
            if (c.shadow != '') {
                let info = c.shadow.split('|');
                let ls = n.getComponent(LabelShadow) || n.addComponent(LabelShadow);
                ls.color = no.str2Color(info[0]);
                ls.offset = this.getAzimuthOffset(Number(info[2]), Number(info[1]));
                ls.blur = Number(info[3]);
            }
        } else {
            let char = n.getComponent(YJCharLabel) || n.addComponent(YJCharLabel);
            char.string = c.text;
            char.fontSize = Number(c.size);
            char.lineHeight = char.fontSize;
            char.color = no.str2Color(c.textColor);
            char.bold = c.bold;
            char.italic = c.italic;
            if (c.outline != '') {
                let info = c.outline.split('|');
                char.outlineColor = no.str2Color(info[0]);
                char.outlineWidth = Number(info[1]);
            }
            if (c.shadow != '') {
                let info = c.shadow.split('|');
                char.shadowColor = no.str2Color(info[0]);
                char.shadowOffset = this.getAzimuthOffset(Number(info[2]), Number(info[1]));
                char.shadowBlur = Number(info[3]);
            }
        }
        return n;
    }

    private createButton(c: any, parent: Node): Node {
        let n = this.getNode(c.name, Button, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        if (!n.getComponent(Button)) {
            let btn = n.addComponent(Button);
            btn.target = n;
            btn.transition = Button.Transition.SCALE;
            n.addComponent(YJButton);
        }
        this.parseChildren(c, n);
        return n;
    }

    private createProgress(c: any, parent: Node): Node {
        let n = this.getNode(c.name, ProgressBar, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        if (!n.getComponent(ProgressBar)) {
            let pb = n.addComponent(ProgressBar);
            let bar = n.children[1] || n.children[0];
            pb.barSprite = bar.getComponent(Sprite);
            pb.totalLength = (c.children[1] || c.children[0]).w;
            bar.setPosition(v3(-pb.totalLength / 2, 0));
            let sp = n.addComponent(SetProgress);
            sp.progressBar = pb;
        }
        return n;
    }

    private createChar(c: any, parent: Node): Node {
        let n = this.getNode(c.name, YJCharLabel, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        n.children[0].active = false;
        if (!n.getComponent(YJCharLabel)) {
            let layout = new Node('Layout');
            layout.parent = n;
            layout.layer = Layers.Enum.UI_2D;
            layout.addComponent(UITransform);
            this.setLayout(layout, Layout.Type.HORIZONTAL, Layout.ResizeMode.CONTAINER);
            let cl = n.addComponent(YJCharLabel);
            cl.dynamicAtlas = this.node.getComponent(YJDynamicAtlas);
            cl.text = n.children[0].getComponent(Label).string;
            this.setLayout(n, Layout.Type.HORIZONTAL, Layout.ResizeMode.CONTAINER);
            n.addComponent(SetText);
        }
        return n;
    }

    private createToggleGroup(c: any, parent: Node): Node {
        let n = this.getNode(c.name, ToggleContainer, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        if (!n.getComponent(ToggleContainer)) {
            n.addComponent(ToggleContainer);
            this.setLayout(n, Layout.Type.HORIZONTAL, Layout.ResizeMode.CONTAINER);
            n.addComponent(YJToggleGroupManager);
        }
        this.parseChildren(c, n);
        return n;
    }

    private createToggle(c: any, parent: Node): Node {
        let n = this.getNode(c.name, Toggle, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        if (!n.getComponent(Toggle)) {
            let toggle = n.addComponent(Toggle);
            toggle.checkMark = n.children[0].getComponent(Sprite);
        }
        return n;
    }

    private createList(c: any, parent: Node): Node {
        let name = c.name.split(':');
        let n = this.getNode(name[1] || name[0], ScrollView, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        if (!n.getComponent(ScrollView)) {
            this.setScrollView(n, Number(name[0]) || 0);
            let sv = n.getComponent(ScrollView);
            let sl = sv.content.addComponent(SetList);
            sl.scrollView = sv;
            sl.dynamicAtlas = this.node.getComponent(YJDynamicAtlas);
        }
        return n;
    }

    private createItem(c: any, parent: Node): Node {
        let n = this.getNode(c.name, Toggle, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        return n;
    }

    private createScrollView(c: any, parent: Node): Node {
        let name = c.name.split(':');
        let n = this.getNode(name[1] || name[0], ScrollView, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        if (!n.getComponent(ScrollView)) {
            this.setScrollView(n, Number(name[0]) || 0);
            this.setLayout(n.getComponent(ScrollView).content, Layout.Type.HORIZONTAL, Layout.ResizeMode.CONTAINER);
        }
        return n;
    }

    private createSlider(c: any, parent: Node): Node {
        let n = this.getNode(c.name, Toggle, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        if (!n.getComponent(Slider)) {
            let s = n.addComponent(Slider);
            s.direction = c.w > c.h ? Slider.Direction.Horizontal : Slider.Direction.Vertical;
            n.addComponent(SetSliderProgress);
            s.handle = n.getComponentInChildren(Sprite);
            s.handle.addComponent(Button);
        }
        return n;
    }

    private createLayout(c: any, parent: Node): Node {
        let n = this.getNode(c.name, Toggle, Number(c.x), Number(c.y), Number(c.w), Number(c.h), parent, false);
        this.parseChildren(c, n);
        if (!n.getComponent(Layout)) {
            let s = n.addComponent(Layout);
            s.type = c.w > c.h ? Layout.Type.HORIZONTAL : Layout.Type.VERTICAL;
            s.resizeMode = Layout.ResizeMode.CONTAINER;
            s.affectedByScale = true;
            if (s.type == Layout.Type.HORIZONTAL) s.alignVertical = true;
            else if (s.type == Layout.Type.VERTICAL) s.alignHorizontal = true;
        }
        return n;
    }

    private getNode(cname: string, type: typeof Component, x: number, y: number, w: number, h: number, parent: Node, addDynamicTexture = true): Node {
        let idx = this.nameMap[cname] || 0;
        this.nameMap[cname] = idx + 1;
        let name = `${cname}_${idx}`;
        let list = this.parent.getComponentsInChildren(type);
        let n: Node;
        for (let i = 0, l = list.length; i < l; i++) {
            let a = list[i].node;
            if (a.name == name) {
                n = a;
                break;
            }
        }
        console.log(cname);
        if (!n) {
            n = new Node(name);
            n.layer = Layers.Enum.UI_2D;
            n.addComponent(UITransform);
        }
        n.parent = parent;
        n.setPosition(x, y);
        n.getComponent(UITransform).setContentSize(w, h || 30);
        this.setWidget(n);
        if (addDynamicTexture && !n.getComponent(YJDynamicTexture)) n.addComponent(YJDynamicTexture).dynamicAtlas = this.node.getComponent(YJDynamicAtlas);
        return n;
    }

    private async setWidget(node: Node) {
        if (node.parent.getComponent(Layout)) return;
        // await no.sleep(0.1);
        let widget = node.getComponent(Widget) || node.addComponent(Widget);
        if (!widget.enabled) return;
        let size = node.parent.getComponent(UITransform).contentSize;
        let rect = node.getComponent(UITransform).getBoundingBox();
        if (rect.center.x < 0) {
            widget.isAlignLeft = true;
            widget.left = size.width / 2 + rect.x;
        } else if (rect.center.x == 0) {
            widget.isAlignHorizontalCenter = true
            widget.horizontalCenter = 0;
        } else if (rect.center.x > 0) {
            widget.isAlignRight = true;
            widget.right = size.width / 2 - rect.x - rect.width;
        }
        if (rect.center.y < 0) {
            widget.isAlignBottom = true;
            widget.bottom = size.height / 2 + rect.y;
        } else if (rect.center.y == 0) {
            widget.isAlignVerticalCenter = true
            widget.verticalCenter = 0;
        } else if (rect.center.y > 0) {
            widget.isAlignTop = true;
            widget.top = size.height / 2 - rect.y - rect.height;
        }
    }

    private async deleteConfigFile(path: string) {
        await Editor.Message.request('asset-db', 'delete-asset', path);
        // console.log('deleteConfigFile', d);
        this.enabled = false;
    }

    private setLayout(node: Node, type: __private._cocos_ui_layout__Type, mode: __private._cocos_ui_layout__ResizeMode) {
        let ll = node.addComponent(Layout);
        ll.type = type;
        ll.resizeMode = mode;
        if (type == Layout.Type.HORIZONTAL)
            ll.alignHorizontal = true;
        else if (type == Layout.Type.VERTICAL)
            ll.alignVertical = true;
    }

    private setScrollView(node: Node, direction: number) {
        let sv = node.addComponent(ScrollView);
        sv.horizontal = direction != 2;
        sv.vertical = direction != 1;
        let view = new Node('view');
        view.layer = Layers.Enum.UI_2D;
        view.parent = node;
        view.addComponent(UITransform).setContentSize(node.getComponent(UITransform).contentSize);
        view.getComponent(UITransform).setAnchorPoint(direction == 1 ? 0 : 0.5, direction == 2 ? 1 : 0.5);
        let widget = view.addComponent(Widget);
        widget.isAlignTop = true;
        widget.isAlignLeft = true;
        widget.isAlignBottom = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.left = 0;
        widget.bottom = 0;
        widget.right = 0;
        view.addComponent(Mask).type = Mask.Type.RECT;
        let content = new Node('content');
        content.parent = view;
        content.addComponent(UITransform).setContentSize(node.getComponent(UITransform).contentSize);
        content.getComponent(UITransform).setAnchorPoint(view.getComponent(UITransform).anchorPoint);
        sv.content = content;
    }

    /**
     * 
     * @param azimuth 光源角度
     * @param distance 距离
     * @returns 
     */
    public getAzimuthOffset(azimuth: number, distance: number): Vec2 {
        //光源角度转阴影角度
        azimuth = azimuth - 180
        //角度转弧度
        var radian = (azimuth * Math.PI) / 180;

        let lonlat = [];
        lonlat[0] = distance * Math.cos(radian)
        lonlat[1] = distance * Math.sin(radian)

        return new Vec2(lonlat[0], lonlat[1])
    }
}
