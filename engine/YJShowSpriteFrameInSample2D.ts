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
/**
 * 
 * 注意：这个组件在3.7.2版本中被废弃，显示/隐藏默认spriteFrame操作移到YJLoadAssets组件中
 * 
 */
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
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetSprite();
            else {
                list[i].removeSprite();
            }
        }
        list = this.getComponentsInChildren('YJLanguageSprite');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetSprite();
            else {
                list[i].removeSprite();
            }
        }
        list = this.getComponentsInChildren('YJBitmapFont');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetFont();
            else list[i].removeFont();
        }
        list = this.getComponentsInChildren('YJLanguageLabel');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetLabel();
            else list[i].removeLabel();
        }
        list = this.getComponentsInChildren('YJCharLabel');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetLabel();
            else list[i].removeLabel();
        }
        list = this.getComponentsInChildren('SetMaterial');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetMaterial();
            else list[i].removeMaterial();
        }
        list = this.getComponentsInChildren('SetSpriteFrame');
        for (let i = 0; i < list.length; i++) {
            if (v) list[i].resetSprite();
            else {
                list[i].removeSprite();
            }
        }
        if (!v) {
            list = this.getComponentsInChildren(Button);
            for (let i = 0; i < list.length; i++) {
                if (list[i].getComponent('SetSpriteFrameInSampler2D') || list[i].getComponent('SetSpriteFrame') || !list[i].getComponent('Sprite')) {
                    list[i].normalSprite = null;
                    list[i].hoverSprite = null;
                    list[i].pressedSprite = null;
                    list[i].disabledSprite = null;
                }
            }
        }
    }

    onLoad() {
        if (EDITOR) {
            // this.showSpriteFrame = this._show;
            this.destroy();
        }
    }
}
