
import { _decorator, Component, Node, Color, SpriteFrame, Label, LabelOutline, LabelShadow, Layers, UIOpacity, UITransform, Font } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicTexture } from '../../engine/YJDynamicTexture';
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
    }

    onDestroy() {
        YJCharLabelCenter.ins = null;
    }

    public getSpriteFrame(uuid: string): SpriteFrame | null {
        let a: SpriteFrame = this.spriteFrameMap[uuid];
        if (a) return a.clone();
        return null;
    }

    public createSpriteFrame(labelNode: Node, uuid: string): Promise<SpriteFrame> {
        labelNode.parent = this.node;
        return new Promise<SpriteFrame>(resolve => {
            this.scheduleOnce(() => {
                let sf = labelNode.getComponent(Label).ttfSpriteFrame.clone();
                sf._uuid = uuid;
                this.spriteFrameMap[uuid] = sf;
                resolve(this.getSpriteFrame(uuid));
                labelNode.active = false;
            });
        });
    }
}
