
import { ccclass, property, Component, Button, executeInEditMode, EDITOR } from '../yj';

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
    @property({ displayName: '显示SpriteFrame' })
    public get showSpriteFrame(): boolean {
        return this._show;
    }

    public set showSpriteFrame(v: boolean) {
        this._show = v;
        this.showSubSpriteFrame(v);
    }
    @property({ serializable: true })
    _show: boolean = false;

    private showSubSpriteFrame(v: boolean) {
        let list: any[] = this.getComponentsInChildren('SetSpriteFrameInSampler2D');
        list.forEach(a => {
            if (v) a.resetSprite();
            else {
                a.removeSprite();
            }
        });
        list = this.getComponentsInChildren('YJBitmapFont');
        list.forEach(a => {
            if (v) a.resetFont();
            else a.removeFont();
        });
        list = this.getComponentsInChildren('fixedLab');
        list.forEach(a => {
            if (v) a.resetLabel();
            else a.removeLabel();
        });
        list = this.getComponentsInChildren('YJCharLabel');
        list.forEach(a => {
            if (v) a.resetLabel();
            else a.removeLabel();
        });
        list = this.getComponentsInChildren('SetMaterial');
        list.forEach(a => {
            if (v) a.resetMaterial();
            else a.removeMaterial();
        });
        list = this.getComponentsInChildren('SetSpriteFrame');
        list.forEach(a => {
            if (v) a.resetSprite();
            else {
                a.removeSprite();
            }
        });
        if (!v) {
            list = this.getComponentsInChildren(Button);
            list.forEach((a: Button) => {
                if (a.getComponent('SetSpriteFrameInSampler2D') || a.getComponent('SetSpriteFrame') || !a.getComponent('Sprite')) {
                    a.normalSprite = null;
                    a.hoverSprite = null;
                    a.pressedSprite = null;
                    a.disabledSprite = null;
                }
            });
        }
    }

    onLoad() {
        if (EDITOR) {
            this.showSpriteFrame = true;
        }
    }
}
