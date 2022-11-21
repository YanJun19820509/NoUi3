
import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, math } from 'cc';
import { EDITOR } from 'cc/env';
import { YJVertexColorTransition } from '../effect/YJVertexColorTransition';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent, disallowMultiple } = _decorator;

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
 * data:string,为指定spriteFrame的名称
 */

@ccclass('SetSpriteFrameInSampler2D')
@requireComponent([Sprite, YJVertexColorTransition])
@disallowMultiple()
export class SetSpriteFrameInSampler2D extends FuckUi {
    @property({ readonly: true })
    defaultName: string = '';
    @property({ readonly: true, tooltip: '用于判断顶点数据类型，0为color类型，1为坐标类型。而shader中具体使用哪个贴图，需要通过atlases的下标+1来判断' })
    defineIndex: number = 1;
    @property({ type: YJDynamicAtlas, readonly: true })
    dynamicAtlas: YJDynamicAtlas = null;

    onLoad() {
        super.onLoad();
        if (EDITOR) {
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
            if (!this.dynamicAtlas) return;
        }
    }

    update() {
        if (EDITOR) {
            let name = this.getComponent(Sprite).spriteFrame?.name || '';
            if (this.defaultName != name) this.defaultName = name;
        }
    }

    start() {
        if (EDITOR) return;
        if (!this.dynamicAtlas) return;
        this.scheduleOnce(() => {
            if (this.defaultName) this.setSpriteFrame(this.defaultName);
        }, 0.1);
    }

    onDataChange(data: any) {
        this.scheduleOnce(() => {
            this.setSpriteFrame(data);
        }, 0.1);
    }

    private setSpriteFrame(name: string) {
        if (!this.dynamicAtlas) return;
        const [i, spriteFrame] = this.dynamicAtlas.getSpriteFrameInAtlas(name);
        if (!spriteFrame) {
            no.log('setSpriteFrame not get', name);
            return;
        }
        this.setTexture();
        let n: any = i + 1;
        if (n > 9) n = `000${n - 9}`;
        else n = `00${n}`;
        const defines: any = { [`${this.defineIndex}-${n}`]: true };
        no.log('setSpriteFrame get', name, i, JSON.stringify(defines));
        let rect = spriteFrame.rect;
        this.resize(rect.width, rect.height);
        this.getComponent(Sprite).spriteFrame.unbiasUV = spriteFrame.unbiasUV;
        this.getComponent(Sprite).spriteFrame.uv = spriteFrame.uv;
        this.getComponent(Sprite).spriteFrame.uvSliced = spriteFrame.uvSliced;
        this.getComponent(Sprite).spriteFrame['_capInsets'] = spriteFrame['_capInsets'];
        this.getComponent(YJVertexColorTransition).setEffect(defines);
    }

    private resize(width: number, height: number) {
        const sprite = this.getComponent(Sprite);
        if (sprite.sizeMode == Sprite.SizeMode.CUSTOM) return;
        let ut = this.getComponent(UITransform);
        ut.setContentSize(width, height);
    }

    private setTexture() {
        if (this.getComponent(Sprite)?.spriteFrame.texture._uuid == this.dynamicAtlas.texture._uuid) return;
        let spriteFrame = new SpriteFrame();
        spriteFrame.originalSize = math.size(this.dynamicAtlas.width, this.dynamicAtlas.height);
        spriteFrame.texture = this.dynamicAtlas.texture;
        spriteFrame.rect = math.rect(0, 0, this.dynamicAtlas.width, this.dynamicAtlas.height);
        this.getComponent(Sprite).spriteFrame = spriteFrame;
    }
}