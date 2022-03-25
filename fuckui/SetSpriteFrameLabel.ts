
import { _decorator, Component, Node, SpriteAtlas, Layout, Sprite, UITransform, Layers } from 'cc';
import { EDITOR } from 'cc/env';
import { DynamicSpriteTexture } from '../engine/DynamicSpriteTexture';
import { FuckUi } from './FuckUi';
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
@requireComponent([Layout, DynamicSpriteTexture])
@executeInEditMode()
export class SetSpriteFrameLabel extends FuckUi {
    @property(SpriteAtlas)
    atlas: SpriteAtlas = null;
    @property
    text: string = '';

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
        this.node.removeAllChildren();
        if (!this.atlas) return;
        let s = String(data);
        for (let i = 0, n = s.length; i < n; i++) {
            let v = s[i];
            this.createLetter(v);
        }
    }

    private createLetter(v: string) {
        let node = new Node(v);
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform);
        let sprite = node.addComponent(Sprite);
        sprite.spriteAtlas = this.atlas;
        sprite.spriteFrame = this.atlas!.getSpriteFrame(v);
        this.node.addChild(node);
    }
}