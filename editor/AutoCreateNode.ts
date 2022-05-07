
import { _decorator, Component, Node, JsonAsset, UITransform, Sprite, SpriteAtlas, SpriteFrame, Label, Size, Layers, Widget, TextAsset, HorizontalTextAlignment, Overflow } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { YJLoadAssets } from './YJLoadAssets';
import { YJReleasePrefab } from '../base/node/YJReleasePrefab';
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
    private size: Size;
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
                let atlasManager = this.getComponent(YJLoadAssets) || this.addComponent(YJLoadAssets);
                no.assetBundleManager.loadFileInEditorMode<SpriteAtlas>(dest + `/${name}.plist`, SpriteAtlas, (s, info) => {
                    this.atlas = s;
                    atlasManager?.addAtlasUuid(info.uuid);
                    // console.log(s);
                    no.assetBundleManager.loadFileInEditorMode<JsonAsset>(dest + `/${name}.json`, JsonAsset, f => {
                        // console.log(f.json);
                        this.createNodes(f.json);
                        this.deleteConfigFile(dest + `/${name}.json`);
                    }, () => {
                        this.enabled = false;
                    });
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    private createNodes(config: any) {
        try {
            // console.log('createNodes', config);
            this.size = new Size(config.width, config.height);
            if (!this.node.getComponent(YJDynamicAtlas))
                this.node.addComponent(YJDynamicAtlas);
            this.node.getComponent(UITransform).setContentSize(this.size);
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
                switch (n.type) {
                    case 'label':
                        this.createLabelNode(n);
                        break;
                    case 'sprite':
                        this.createSpriteNode(n);
                        break;
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    private createSpriteNode(c: any) {
        let n = this.getNode(c.name, Sprite, Number(c.x), Number(c.y), Number(c.w), Number(c.h));
        let s = n.getComponent(Sprite) || n.addComponent(Sprite);
        s.sizeMode = Sprite.SizeMode.CUSTOM;
        s.spriteFrame = this.atlas.getSpriteFrame(c.name);
        if (s.spriteFrame)
            s.spriteAtlas = this.atlas;
        else {
            // let p = `${this.rootPath.replace('db://assets/', '')}/${c.name}`;
            // console.log(p);
            // no.assetBundleManager.loadSprite(p, sf => {
            //     console.log(sf);
            //     this.getComponent(YJLoadAssets)?.addSpriteFrameUuid(sf._uuid);
            //     s.spriteFrame = sf;
            // });
            no.assetBundleManager.loadSpriteFrameInEditorMode(`${this.rootPath}/${c.name}.png`, (f, info) => {
                this.getComponent(YJLoadAssets)?.addSpriteFrameUuid(info.uuid);
                s.spriteFrame = f;
            });
        }
        if (c.name.indexOf('9_') == 0) {
            s.type = Sprite.Type.SLICED;
        }
    }

    private createLabelNode(c: any) {
        let n = this.getNode(c.name, Label, Number(c.x), Number(c.y), Number(c.w), Number(c.h));
        let l = n.getComponent(Label) || n.addComponent(Label);
        l.string = c.text;
        l.fontSize = Number(c.size);
        l.lineHeight = l.fontSize;
        l.color = no.str2Color(c.textColor);
        l.isBold = c.bold == 'true';
        l.isItalic = c.italic == 'true';
        l.horizontalAlign = c.justification == 'right' ? HorizontalTextAlignment.RIGHT : (c.justification == 'center' ? HorizontalTextAlignment.CENTER : HorizontalTextAlignment.LEFT);
        if (c.direction == 'vertical') {
            l.overflow = Overflow.RESIZE_HEIGHT;
        }
    }

    private getNode(cname: string, type: typeof Component, x: number, y: number, w: number, h: number): Node {
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
            n.parent = this.parent;
        }
        n.setPosition(x - this.size.width / 2, this.size.height / 2 - y);
        n.getComponent(UITransform).setContentSize(w, h);
        this.setWidget(n);
        if (!n.getComponent(YJDynamicTexture)) n.addComponent(YJDynamicTexture);
        return n;
    }

    private async setWidget(node: Node) {
        await no.sleep(0.1);
        let widget = node.getComponent(Widget) || node.addComponent(Widget);
        if (!widget.enabled) return;
        let rect = node.getComponent(UITransform).getBoundingBox();
        if (rect.center.x < 0) {
            widget.isAlignLeft = true;
            widget.left = this.size.width / 2 + rect.x;
        } else if (rect.center.x == 0) {
            widget.isAlignHorizontalCenter = true
            widget.horizontalCenter = 0;
        } else if (rect.center.x > 0) {
            widget.isAlignRight = true;
            widget.right = this.size.width / 2 - rect.x - rect.width;
        }
        if (rect.center.y < 0) {
            widget.isAlignBottom = true;
            widget.bottom = this.size.height / 2 + rect.y;
        } else if (rect.center.y == 0) {
            widget.isAlignVerticalCenter = true
            widget.verticalCenter = 0;
        } else if (rect.center.y > 0) {
            widget.isAlignTop = true;
            widget.top = this.size.height / 2 - rect.y - rect.height;
        }
    }

    private async deleteConfigFile(path: string) {
        await Editor.Message.request('asset-db', 'delete-asset', path);
        // console.log('deleteConfigFile', d);
        this.enabled = false;
    }
}
