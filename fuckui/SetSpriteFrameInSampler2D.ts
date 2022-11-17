
import { _decorator, Component, Node, SpriteAtlas, Sprite, SpriteFrame, UITransform } from 'cc';
import { YJVertexColorTransition } from '../effect/YJVertexColorTransition';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetSpriteFrameInSampler2D
 * DateTime = Tue Nov 15 2022 22:25:51 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameInSampler2D.ts
 * FileBasenameNoExtension = SetSpriteFrameInSampler2D
 * URL = db://assets/Script/NoUi3/fuckui/SetSpriteFrameInSampler2D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用于设置材质中挂载的纹理采样的区域
 * data = {
 * define: string,
 * name: string
 * } | string
 * define:挂载纹理的属性标识，用于区分多个纹理属性
 * name:图集中 spriteFrame 的 name
 */

@ccclass('SetSpriteFrameInSampler2D')
@requireComponent([Sprite, YJVertexColorTransition])
export class SetSpriteFrameInSampler2D extends FuckUi {
    @property({ type: SpriteAtlas })
    atlases: SpriteAtlas[] = [];
    @property
    define: string = '';

    onDataChange(data: any) {
        let defines: any = {};
        let key = data.define || this.define;
        defines[key] = true;
        let spriteFrame = this.getSpriteFrameInAtlas(data.name || data);
        if (!spriteFrame) return;
        let properties: number[],
            rect = spriteFrame.rect,
            x1 = rect.x,
            y1 = rect.y,
            x2 = x1 + rect.width,
            y2 = y1 + rect.height;
        properties = [x1 + y1 / 10000, x2 + y2 / 10000];
        this.resize(rect.width, rect.height);
        this.getComponent(YJVertexColorTransition).setEffect(defines, properties);
    }

    private getSpriteFrameInAtlas(name: string): SpriteFrame | null {
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            let s = this.atlases[i].getSpriteFrame(name);
            if (s) return s;
        }
        return null;
    }

    private resize(width: number, height: number) {
        const sprite = this.getComponent(Sprite);
        if (sprite.sizeMode == Sprite.SizeMode.CUSTOM) return;
        const ut = this.getComponent(UITransform);
        ut.setContentSize(width, height);
    }
}