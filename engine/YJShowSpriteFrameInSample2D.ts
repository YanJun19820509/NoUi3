
import { EDITOR, ccclass, property, executeInEditMode, Component, Node } from '../yj';

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
export class YJShowSpriteFrameInSample2D extends Component {
    @property
    public get showSpriteFrame(): boolean {
        return false;
    }

    public set showSpriteFrame(v: boolean) {
        this.showSubSpriteFrame(true);
    }
    @property
    public get hideSpriteFrame(): boolean {
        return false;
    }

    public set hideSpriteFrame(v: boolean) {
        this.showSubSpriteFrame(false);
    }

    private showSubSpriteFrame(v: boolean) {
        let list: any[] = this.getComponentsInChildren('SetSpriteFrameInSampler2D');
        list.forEach(a => {
            if (v) a.resetSprite();
            else a.removeSprite();
        });
        list = this.getComponentsInChildren('YJBitmapFont');
        list.forEach(a => {
            if (v) a.resetFont();
            else a.removeFont();
        });
        list = this.getComponentsInChildren('YJCharLabel');
        list.forEach(a => {
            if (v) a.resetLabel();
            else a.removeLabel();
        });
    }
}
