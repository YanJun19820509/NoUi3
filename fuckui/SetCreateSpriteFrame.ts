
import { _decorator, Component, Node, SpriteFrame, math, Texture2D, Label, LabelOutline, LabelShadow, Layers, UITransform } from 'cc';
import { DynamicAtlasTexture } from '../engine/atlas';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SetCreateSpriteFrame
 * DateTime = Fri Jul 15 2022 23:31:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetCreateSpriteFrame.ts
 * FileBasenameNoExtension = SetCreateSpriteFrame
 * URL = db://assets/Script/NoUi3/fuckui/SetCreateSpriteFrame.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * data: {
 *     width:number,
 *     height:number,
 *     spriteFrames:[{
 *                     url: string,
 *                     x: number,
 *                     y: number
 *                  }],
 *     labels:[{
 *                 string: string,
 *                 x: number,
 *                 y: number
 *                 size?: number,
 *                 font?: string,
 *                 color?: number,
 *                 letterSpacing?: number,
 *                 italic?: boolean,
 *                 bold?: boolean,
 *                 outlineColor?: string,
 *                 outlineWidth?: number,
 *                 shadowColor?: string,
 *                 shadowOffset?: number[],
 *                 shadowBlur?: number
 *             }]
 * }
 */
@ccclass('SetCreateSpriteFrame')
export class SetCreateSpriteFrame extends FuckUi {
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;

    protected onDataChange(data: any) {
        let texture = new DynamicAtlasTexture();
        texture.initWithSize(data.width, data.height);
        let newSf = new SpriteFrame();
        newSf.texture = texture;
        newSf._uuid = `${no.sysTime.now}`;
        this.createSpriteFrames(texture, data.spriteFrames);
        this.createTTFSpriteFrames(texture, data.labels);
    }

    private createSpriteFrames(texture: DynamicAtlasTexture, spriteFrames: { url: string, x: number, y: number }[]) {
        spriteFrames.forEach(a => {
            no.assetBundleManager.loadSprite(a.url, sf => {
                this.drawSpriteFrameToTexture(sf, texture, a.x, a.y);
            });
        });
    }

    private createTTFSpriteFrames(texture: DynamicAtlasTexture, labels: {
        string: string,
        x: number,
        y: number
        size?: number,
        font?: string,
        color?: number,
        letterSpacing?: number,
        italic?: boolean,
        bold?: boolean,
        outlineColor?: string,
        outlineWidth?: number,
        shadowColor?: string,
        shadowOffset?: number[],
        shadowBlur?: number
    }[]) {
        labels.forEach(a => {
            this.createTTFSpriteFrame(a).then(sf => {
                this.drawSpriteFrameToTexture(sf, texture, a.x, a.y);
            });
        });
    }

    private createTTFSpriteFrame(d: any): Promise<SpriteFrame> {
        let label = this.createLabel(d);
        return new Promise<SpriteFrame>(resolve => {
            this.scheduleOnce(() => {
                resolve(label.ttfSpriteFrame)
            });
        });
    }

    private createLabel(d: any): Label {
        let labelNode = new Node();
        labelNode.layer = Layers.Enum.EDITOR;
        labelNode.addComponent(UITransform);
        let label = labelNode.addComponent(Label);
        label.color = d.color;
        label.font = d.font;
        label.fontSize = d.size;
        label.lineHeight = d.size + 4;
        label.isItalic = d.italic;
        label.isBold = d.bold;
        label.cacheMode = Label.CacheMode.BITMAP;
        if (d.outlineColor) {
            let outline = labelNode.addComponent(LabelOutline);
            outline.color = d.outlineColor;
            outline.width = d.outlineWidth;
        }
        if (d.shadowColor) {
            let shadow = labelNode.addComponent(LabelShadow);
            shadow.color = d.shadowColor;
            shadow.offset = d.shadowOffset;
            shadow.blur = d.shadowBlur;
        }
        labelNode.addComponent(YJDynamicTexture).dynamicAtlas = this.dynamicAtlas;
        labelNode.getComponent(YJDynamicTexture).packLabelFrame(d.string);
        labelNode.parent = this.node;
        return label;
    }

    private drawSpriteFrameToTexture(sf: SpriteFrame, texture: DynamicAtlasTexture, x: number, y: number) {
        let rect = sf.rect;
        let buffer = texture.getTextureBuffer(sf.texture as Texture2D, rect);
        let img = this._createImage(buffer, rect);
        texture.drawImageAt(img, x - rect.width / 2, y - rect.height / 2);
    }

    private _createImage(pixels: ArrayBufferView, rect: math.Rect) {
        let canvas = document.createElement('canvas');
        canvas.width = rect.width;
        canvas.height = rect.height;
        let ctx = canvas.getContext("2d");
        let imageData = ctx.createImageData(rect.width, rect.height);
        let i = 0,
            k = 0,
            data = imageData.data,
            length = data.length;
        while (i < length) {
            data[i++] = pixels[k++];
            data[i++] = pixels[k++];
            data[i++] = pixels[k++];
            data[i++] = pixels[k++];
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
}
