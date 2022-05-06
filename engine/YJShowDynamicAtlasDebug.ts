
import { _decorator, Component, Node, Widget, director, BlockInputEvents, Layout, ScrollView, Sprite, SpriteFrame, UITransform, Layers, find } from 'cc';
import { DEBUG } from 'cc/env';
import { no } from '../no';
import { Atlas } from './atlas';
const { ccclass, property } = _decorator;

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

    constructor() {
        this.list = {};
    }

    public add(a: Atlas, name: string): void {
        if (!a || !name) return;
        this.list[name] = a;
    }

    public remove(name: string): void {
        if (!name) return;
        delete this.list[name];
    }

    public showDebug(name?: string) {
        if (!DEBUG) return;
        if (name) {
            if (!this._debugNode || !this._debugNode.isValid) {

                this._debugNode = new Node('DYNAMIC_ATLAS_DEBUG_NODE');
                this._debugNode.addComponent(UITransform);
                this._debugNode.layer = Layers.Enum.UI_2D;

                let widget = this._debugNode.addComponent(Widget);
                widget.isAlignTop = true;
                widget.isAlignLeft = true;
                widget.isAlignBottom = true;
                widget.isAlignRight = true;
                widget.top = 0;
                widget.left = 0;
                widget.bottom = 0;
                widget.right = 0;
                this._debugNode.parent = find('Canvas');

                this._debugNode.addComponent(BlockInputEvents);

                let scroll = this._debugNode.addComponent(ScrollView);

                // let content = new Node('CONTENT');
                // content.addComponent(UITransform);
                // content.layer = Layers.Enum.UI_2D;
                // let layout = content.addComponent(Layout);
                // layout.type = Layout.Type.VERTICAL;
                // layout.resizeMode = Layout.ResizeMode.CONTAINER;
                // content.parent = this._debugNode;


                let texture = this.list[name]._texture;

                let node = new Node('ATLAS');
                node.addComponent(UITransform);
                node.layer = Layers.Enum.UI_2D;
                no.width(node, texture.width);
                no.height(node, texture.height);
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;

                let sprite = node.addComponent(Sprite);
                sprite.spriteFrame = spriteFrame;

                node.parent = this._debugNode;
                scroll.content = node;
            }
        } else {
            if (this._debugNode) {
                this._debugNode.removeFromParent();
                this._debugNode = null;
            }
        }
    }

}

window['showDynamicAtlas'] = function (name?: string) {
    YJShowDynamicAtlasDebug.ins.showDebug(name);
};