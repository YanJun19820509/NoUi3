
import { ccclass, Node, ScrollView, Sprite, SpriteFrame, UITransform, Layers, find, instantiate } from '../yj';
import { no } from '../no';
import { Atlas } from './atlas';
import { YJWindowManager } from '../base/node/YJWindowManager';

/**
 * Predefined variables
 * Name = YJShowDynamicAtlasDebug
 * DateTime = Thu May 05 2022 18:29:56 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowDynamicAtlasDebug.ts
 * FileBasenameNoExtension = YJShowDynamicAtlasDebug
 * URL = db://assets/NoUi3/engine/YJShowDynamicAtlasDebug.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJShowDynamicAtlasDebug')
export class YJShowDynamicAtlasDebug {
    private static _ins: YJShowDynamicAtlasDebug;

    public static get ins(): YJShowDynamicAtlasDebug {
        if (!this._ins)
            this._ins = new YJShowDynamicAtlasDebug();
        return this._ins;
    }

    private list: any;
    private _debugNode: Node;
    private names: string[];

    constructor() {
        this.list = {};
        this.names = [];
        no.evn.on('close_dynamic_atlas_debug_node', () => {
            this._clearDebugNode();
        }, this);
    }

    public add(a: Atlas, name: string): void {
        if (!a || !name) return;
        this.list[name] = a;
        this.names[this.names.length] = name;
    }

    public remove(name: string): void {
        if (!name) return;
        delete this.list[name];
        this.names.splice(this.names.indexOf(name), 1);
    }

    public showDebug(name?: string) {
        if (!no.isDebug()) return;
        if (!name) {
            return;
        }
        let texture = this.list[name]?._texture;
        if (!texture) {
            no.warn('show atlas not found', name);
            return;
        }
        no.warn('show atlas', name, {
            width: texture.width,
            height: texture.height,
            mem: texture.width * texture.height * 4 / 1024 / 1024 + 'M'
        });
        if (!this._debugNode || !this._debugNode.isValid) {

            no.assetBundleManager.loadPrefab('NoUi3/engine/dynamic_atlas_debug_node', item => {
                this._debugNode = instantiate(item);
                this._debugNode.parent = find('Canvas');
                let scrollView = this._debugNode.getComponentInChildren(ScrollView);

                no.width(scrollView.content, texture.width);
                no.height(scrollView.content, texture.height);

                let node = new Node('ATLAS');
                node.addComponent(UITransform).setAnchorPoint(0, 1);
                node.layer = Layers.Enum.UI_2D;
                no.width(node, texture.width);
                no.height(node, texture.height);
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                let sprite = node.addComponent(Sprite);
                sprite.spriteFrame = spriteFrame;

                node.parent = scrollView.content;
            });
        }
    }

    private _clearDebugNode() {
        if (this._debugNode) {
            this._debugNode.removeFromParent();
            this._debugNode = null;
        }
    }

    public logInfos(): void {
        let infos = [];
        for (const key in this.list) {
            let a: Atlas = this.list[key];
            infos[infos.length] = {
                name: key,
                width: a._texture.width,
                height: a._texture.height,
                mem: a._texture.width * a._texture.height * 4 / 1024 / 1024 + 'M'
            };
        }
        // let keys = Object.keys(this.list);
        console.log(infos);
    }

    public showNewestAtlas(): any {
        const topPanel = YJWindowManager.getTopPanel(3);
        if (topPanel) {
            const name = no.getPrototype(topPanel.getComponentInChildren('PopuPanelContent') || topPanel.getComponent('YJPanel'))?.name || topPanel.name;
            if (this.names.includes(name)) {
                this.showDebug(name);
                return;
            }
        }
        this.showDebug(this.names[this.names.length - 1]);
    }
}

window['showDynamicAtlas'] = function (name?: string) {
    YJShowDynamicAtlasDebug.ins.showDebug(name);
};

window['showDynamicAtlasInfos'] = function () {
    YJShowDynamicAtlasDebug.ins.logInfos();
};