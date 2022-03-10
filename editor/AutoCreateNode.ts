
import { _decorator, Component, Node, assetManager, JsonAsset, UITransform, Sprite, SpriteAtlas, SpriteFrame, Label, Size } from 'cc';
import { EDITOR } from 'cc/env';
import { no } from '../no';
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

    onEnable() {
        if (EDITOR) {
            this.loadConfigFile();
        }
    }

    private async loadConfigFile() {
        try {
            let name = this.node.name;
            let a = await Editor.Dialog.select({
                path: '.',
                multi: false,
                type: 'directory'
            });
            if (!a.canceled) {
                let path = a.filePaths[0];
                // console.log(path);
                path = path.replace(/\\/g, '/');
                // console.log(path);
                let root = Editor.Project.path.replace(/\\/g, '/');
                let dest = path.replace(root + '/', 'db://');
                // console.log(dest);
                no.assetBundleManager.loadFileInEditorMode<SpriteAtlas>(dest + `/${name}.plist`, SpriteAtlas, s => {
                    this.atlas = s;
                    // console.log(s);
                    no.assetBundleManager.loadFileInEditorMode<JsonAsset>(dest + `/${name}.json`, JsonAsset, f => {
                        this.createNodes(f.json);
                        this.deleteConfigFile(dest + `/${name}.json`);
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
            this.node.getComponent(UITransform).setContentSize(this.size);
            let parent = this.node.getChildByName('Canvas') || this.node
            config.nodes.forEach((n: any) => {
                switch (n.type) {
                    case 'label':
                        this.createLabelNode(n, parent);
                        break;
                    case 'sprite':
                        this.createSpriteNode(n, parent);
                        break;
                }
            });
        } catch (e) {
            console.log(e);
        }
    }

    private createSpriteNode(c: any, parent: Node) {
        let n = this.createNode(c.name, Number(c.x), Number(c.y), Number(c.w), Number(c.h));
        n.parent = parent;
        let s = n.addComponent(Sprite);
        s.spriteAtlas = this.atlas;
        s.spriteFrame = this.atlas.getSpriteFrame(c.name);
    }

    private createLabelNode(c: any, parent: Node) {
        let n = this.createNode(c.name, Number(c.x), Number(c.y), Number(c.w), Number(c.h));
        n.parent = parent;
        let l = n.addComponent(Label);
        l.string = c.text;
        l.fontSize = Number(c.size);
        l.lineHeight = l.fontSize;
        l.color = no.str2Color(c.textColor);
        l.isBold = Boolean(c.bold);
        l.isItalic = Boolean(c.italic);
    }

    private createNode(name: string, x: number, y: number, w: number, h: number): Node {
        let node = new Node(name);
        node.setPosition(x - this.size.width / 2, this.size.height / 2 - y);
        let t = node.addComponent(UITransform);
        t.setContentSize(w, h);
        return node;
    }

    private async deleteConfigFile(path: string) {
        let d = await Editor.Message.request('asset-db', 'delete-asset', path);
        // console.log('deleteConfigFile', d);
        this.destroy();
    }
}
