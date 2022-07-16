
import { _decorator, Component, Node, SpriteFrame, math, Texture2D, Label, LabelOutline, LabelShadow, Layers, UITransform, Sprite } from 'cc';
import { DynamicAtlasTexture } from '../engine/atlas';
import { no } from '../no';
import { CreateSpritemFrameData, CreateSpritemFrameLabelData, CreateSpritemFrameSFData } from '../types';
import { FuckUi } from './FuckUi';
const { ccclass, property, requireComponent } = _decorator;

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
 * data: CreateSpritemFrameData
 */
@ccclass('SetCreateSpriteFrame')
@requireComponent(Sprite)
export class SetCreateSpriteFrame extends FuckUi {

    private texture: DynamicAtlasTexture;

    protected onDataChange(data: CreateSpritemFrameData) {
        this.texture = new DynamicAtlasTexture();
        this.texture.initWithSize(data.width, data.height);
        let newSf = new SpriteFrame();
        newSf.texture = this.texture;
        newSf._uuid = `${no.sysTime.now}`;
        this.getComponent(Sprite).spriteFrame = newSf;
        this.drawSpriteFrames(data.spriteFrames).then(canvas => {
            if (data.labels && data.labels.length > 0)
                this.drawTTFSpriteFrames(data.labels, canvas);
            else this.texture.drawImageAt(canvas, 0, 0);
        });
    }

    private drawSpriteFrames(spriteFrames: CreateSpritemFrameSFData[]): Promise<HTMLCanvasElement> {
        return new Promise<HTMLCanvasElement>(resolve => {
            let arr: { frame: SpriteFrame, x: number, y: number }[] = [];
            for (let i = 0, n = spriteFrames.length; i < n; i++) {
                let a = spriteFrames[i];
                no.assetBundleManager.loadSprite(a.url + '/spriteFrame', sf => {
                    arr[arr.length] = {
                        frame: sf,
                        x: a.x,
                        y: a.y
                    };
                    if (arr.length == n) {
                        resolve(this.drawSpriteFramesToCanvas(arr));
                    }
                });
            }
        });
    }

    private drawTTFSpriteFrames(labels: CreateSpritemFrameLabelData[], canvas: HTMLCanvasElement) {
        let arr: { label: Label, x: number, y: number }[] = [];
        labels.forEach(a => {
            let label = this.createLabel(a);
            arr[arr.length] = {
                label: label,
                x: a.x,
                y: a.y
            }
        });
        this.scheduleOnce(() => {
            this.drawTTFSpriteFramesToCanvas(arr, canvas);
            this.texture.drawImageAt(canvas, 0, 0);
        });
    }

    private createLabel(d: any): Label {
        let labelNode = new Node();
        labelNode.layer = Layers.Enum.EDITOR;
        labelNode.addComponent(UITransform);
        let label = labelNode.addComponent(Label);
        label.color = no.str2Color(d.color);
        label.font = d.font;
        label.fontSize = d.size;
        label.lineHeight = d.size + 4;
        label.isItalic = d.italic;
        label.isBold = d.bold;
        label.cacheMode = Label.CacheMode.NONE;
        if (d.outlineColor) {
            let outline = labelNode.addComponent(LabelOutline);
            outline.color = no.str2Color(d.outlineColor);
            outline.width = d.outlineWidth;
        }
        if (d.shadowColor) {
            let shadow = labelNode.addComponent(LabelShadow);
            shadow.color = no.str2Color(d.shadowColor);
            shadow.offset = d.shadowOffset;
            shadow.blur = d.shadowBlur;
        }
        label.string = d.string;
        labelNode.parent = this.node;
        return label;
    }

    private drawSpriteFrameToTexture(sf: SpriteFrame, x: number, y: number) {
        let rect = sf.rect;
        let buffer = this.texture.getTextureBuffer(sf.texture as Texture2D, rect);
        let img = this._createImage(buffer, rect);
        this.texture.drawImageAt(img, x - rect.width / 2, y - rect.height / 2);
    }

    private drawTTFSpriteFramesToCanvas(labels: { label: Label, x: number, y: number }[], canvas: HTMLCanvasElement) {
        let ctx = canvas.getContext("2d");
        labels.forEach(a => {
            let rect = a.label.ttfSpriteFrame.rect;
            let buffer = this.texture.getTextureBuffer(a.label.ttfSpriteFrame.texture as Texture2D, rect);
            let img = this._createImage(buffer, rect);
            ctx.drawImage(img, a.x - rect.width / 2, a.y - rect.height / 2);
        });
    }

    private drawSpriteFramesToCanvas(frames: { frame: SpriteFrame, x: number, y: number }[]): HTMLCanvasElement {
        let canvas = document.createElement('canvas');
        canvas.width = this.texture.width;
        canvas.height = this.texture.height;
        let ctx = canvas.getContext("2d");
        frames.forEach(a => {
            let rect = a.frame.rect;
            let buffer = this.texture.getTextureBuffer(a.frame.texture as Texture2D, rect);
            let img = this._createImage(buffer, rect);
            ctx.drawImage(img, a.x - rect.width / 2, a.y - rect.height / 2);
        });
        return canvas;
    }

    private _createImage(pixels: ArrayBufferView, rect: math.Rect): HTMLCanvasElement {
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
