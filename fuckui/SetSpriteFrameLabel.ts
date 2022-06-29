
import { _decorator, Component, Node, SpriteAtlas, Layout, Sprite, UITransform, Layers, Vec2, v2 } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
import { SetGray } from './SetGray';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetSpriteFrameLabel
 * DateTime = Sat Feb 05 2022 23:11:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameLabel.ts
 * FileBasenameNoExtension = SetSpriteFrameLabel
 * URL = db://assets/NoUi3/fuckui/SetSpriteFrameLabel.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetSpriteFrameLabel')
@menu('NoUi/ui/SetSpriteFrameLabel(设置精灵文本:string)')
@requireComponent(Layout)
@executeInEditMode()
export class SetSpriteFrameLabel extends FuckUi {
    @property(SpriteAtlas)
    atlas: SpriteAtlas = null;
    @property
    text: string = '';
    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';
    @property
    anchor: Vec2 = v2();
    @property
    isGray: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    onLoad() {
        if (EDITOR) return;
        super.onLoad();
        !this.dataSetted && this.setData(JSON.stringify(this.text));
    }

    update() {
        if (!EDITOR) return;
        this.setData(JSON.stringify(this.text));
    }

    protected onDataChange(data: any) {
        if (EDITOR)
            this.node.removeAllChildren();
        if (!this.atlas) return;
        let s = '';
        if (typeof data == 'string') {
            if (data != '')
                s = no.formatString(this.formatter, data.split('|'));
        } else if (typeof data == 'number') {
            s = no.formatString(this.formatter, { '0': data });
        } else {
            s = no.formatString(this.formatter, data);
        }
        let n = Math.max(this.node.children.length, s.length);
        for (let i = 0; i < n; i++) {
            let v = s[i];
            let node = this.node.children[i];
            if (!node) {
                node = new Node(v);
                node.layer = Layers.Enum.UI_2D;
                node.addComponent(UITransform).anchorPoint = this.anchor;
                let sprite = node.addComponent(Sprite);
                sprite.spriteAtlas = this.atlas;
                node.addComponent('YJDynamicTexture')['dynamicAtlas'] = this.dynamicAtlas;
                if (this.isGray) {
                    node.addComponent(SetEffect);
                    let gray = node.addComponent(SetGray);
                    gray.autoGray = true;
                }
                this.node.addChild(node);
            } else if (v == undefined) {
                node.active = false;
                continue;
            }
            node.active = true;
            let sf = this.atlas!.getSpriteFrame(String(v.charCodeAt(0)));
            if (!EDITOR)
                node.getComponent('YJDynamicTexture')['packSpriteFrame'](sf);
            else node.getComponent(Sprite).spriteFrame = sf;
        }
    }
}