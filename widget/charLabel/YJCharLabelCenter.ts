
import { _decorator, Component, Node, Color, SpriteFrame, Label, LabelOutline, LabelShadow, Layers, UIOpacity, UITransform, Font } from 'cc';
import { DEBUG, EDITOR } from 'cc/env';
import { resolve } from 'path';
import { YJDynamicTexture } from '../../engine/YJDynamicTexture';
import { no } from '../../no';
const { ccclass, property } = _decorator;

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

@ccclass('YJCharLabelCenter')
export class YJCharLabelCenter extends Component {
    public static ins: YJCharLabelCenter;

    private spriteFrameMap = {};


    onLoad() {
        YJCharLabelCenter.ins = this;
        if (DEBUG) window['YJCharLabelCenter'] = YJCharLabelCenter.ins;
    }

    onDestroy() {
        YJCharLabelCenter.ins = null;
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
        let sf = labelNode.getComponent(Label).ttfSpriteFrame;
        sf._uuid = uuid;
        this.spriteFrameMap[uuid] = sf;
        labelNode.getComponent(Label)['_ttfSpriteFrame'] = null;
        labelNode.destroy();
        return this.getSpriteFrame(uuid);
    }
}