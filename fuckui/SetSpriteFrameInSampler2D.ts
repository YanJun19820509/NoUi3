
import { _decorator, Component, Node, SpriteAtlas, Sprite } from 'cc';
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
    atlas: SpriteAtlas = null;
    @property
    define: string = '';

    onDataChange(data: any) {
        let defines: any = {};
        let key = data.define || this.define;
        defines[key] = true;
        let spriteFrame = this.atlas?.getSpriteFrame(data.name || data);
        if (!spriteFrame) return;
        let properties: number[],
            offset = spriteFrame.offset,
            width = spriteFrame.width,
            height = spriteFrame.height,
            x1 = offset.x,
            y1 = offset.y,
            x2 = x1 + width,
            y2 = y1 + height;
        properties = [x1 + y1 / 1000, x2 + y2 / 1000];
        this.getComponent(YJVertexColorTransition).setEffect(defines, properties);
    }
}