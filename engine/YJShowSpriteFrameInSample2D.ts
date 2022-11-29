
import { _decorator, Component, Node } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJShowSpriteFrameInSample2D
 * DateTime = Mon Nov 28 2022 18:48:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJShowSpriteFrameInSample2D.ts
 * FileBasenameNoExtension = YJShowSpriteFrameInSample2D
 * URL = db://assets/NoUi3/engine/YJShowSpriteFrameInSample2D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//用来控制使用SetSpriteFrameInSample2D的Sprite显示/隐藏默认spriteFrame
@ccclass('YJShowSpriteFrameInSample2D')
@executeInEditMode()
export class YJShowSpriteFrameInSample2D extends Component {
    @property
    showSpriteFrame: boolean = false;
    @property
    hideSpriteFrame: boolean = false;

    update() {
        if (!EDITOR) return;
        if (this.showSpriteFrame) {
            this.showSpriteFrame = false;
            this.showSubSpriteFrame(true);
            return;
        }
        if (this.hideSpriteFrame) {
            this.hideSpriteFrame = false;
            this.showSubSpriteFrame(false);
            return;
        }
    }

    private showSubSpriteFrame(v: boolean) {
        let list: any[] = this.getComponentsInChildren('SetSpriteFrameInSampler2D');
        list.forEach(a => {
            if (v) a.resetSprite();
            else a.removeSprite();
        });
    }
}
