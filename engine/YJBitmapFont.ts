
import { _decorator, Component, Node, BitmapFont, Label, SpriteFrame } from 'cc';
import { EDITOR } from 'cc/env';
import { YJDynamicAtlas } from './YJDynamicAtlas';
const { ccclass, property, executeInEditMode, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJBitmapFont
 * DateTime = Fri Jul 01 2022 00:00:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJBitmapFont.ts
 * FileBasenameNoExtension = YJBitmapFont
 * URL = db://assets/Script/NoUi3/engine/YJBitmapFont.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJBitmapFont')
@requireComponent([Label])
@executeInEditMode()
export class YJBitmapFont extends Component {
    @property(BitmapFont)
    font: BitmapFont = null;
    @property
    preview: boolean = false;
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    onLoad() {
        if (!EDITOR) this.createBitmapFont();
    }

    private createBitmapFont() {
        if (!this.font) return;
        let bf = new BitmapFont();
        bf.fntConfig = this.font.fntConfig;
        bf.fontSize = this.font.fontSize;
        bf.fntDataStr = this.font.fntDataStr;
        bf.fontDefDictionary = this.font.fontDefDictionary;
        let sf = this.font.spriteFrame.clone();
        if (!EDITOR) {
            let packedFrame = this.dynamicAtlas.insertSpriteFrame(sf);
            sf._setDynamicAtlasFrame(packedFrame);
        }
        bf.spriteFrame = sf;
        this.getComponent(Label).font = bf;
    }

    update() {
        if (!EDITOR) return;
        if (!this.preview) this.getComponent(Label).font = null;
        else {
            if (this.getComponent(Label).font) return;
            this.createBitmapFont();
        }
    }
}
