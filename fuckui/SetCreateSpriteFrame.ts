
import { _decorator, Component, Node, SpriteFrame, math, Texture2D, Label, LabelOutline, LabelShadow, Layers, UITransform, Sprite, SpriteAtlas } from './yj';
import { DynamicAtlasTexture } from '../engine/atlas';
import { YJDynamicTexture } from '../engine/YJDynamicTexture';
import { no } from '../no';
import { CreateSpritemFrameData, CreateSpritemFrameLabelData, CreateSpritemFrameSFData } from '../types';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
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
    @property({ type: SpriteAtlas })
    atlases: SpriteAtlas[] = [];

    private texture: DynamicAtlasTexture;

    protected onDataChange(data: CreateSpritemFrameData) {
        if (!data) return;
        this.texture = new DynamicAtlasTexture();
        this.texture.initWithSize(data.width, data.height);
        this.drawSpriteFrames(data.spriteFrames).then(() => {
            if (data.labels && data.labels.length > 0)
                this.drawTTFSpriteFrames(data.labels);
            else {
                this.setSpriteFrame();
            }
        }).catch(e => { no.err(e); });
    }

    private findSpriteFrame(name: string): SpriteFrame {
        for (let i = 0, n = this.atlases.length; i < n; i++) {
            let sf = this.atlases[i].getSpriteFrame(name);
            if (sf) return sf;
        }
        return null;
    }

    private drawSpriteFrames(spriteFrames: CreateSpritemFrameSFData[]): Promise<void> {
        return new Promise<void>(resolve => {
            let arr: { frame: SpriteFrame, x: number, y: number }[] = [];
            for (let i = 0, n = spriteFrames.length; i < n; i++) {
                const a = spriteFrames[i];
                const sf = this.findSpriteFrame(a.name);
                arr[arr.length] = {
                    frame: sf,
                    x: a.x,
                    y: a.y
                };
                if (arr.length == n) {
                    resolve(this.drawSpriteFramesToTexture(arr));
                }
            }
        });
    }

    private drawTTFSpriteFrames(labels: CreateSpritemFrameLabelData[]) {
        let arr: { label: Label, x: number, y: number }[] = [];
        labels.forEach(a => {
            this.createLabel(a).then(label => {
                arr[arr.length] = {
                    label: label,
                    x: a.x,
                    y: a.y
                };
                if (arr.length == labels.length) {
                    this.scheduleOnce(() => {
                        this.drawTTFSpriteFramesToCanvas(arr);
                        this.setSpriteFrame();
                    });
                }
            }).catch(e => { no.err(e); });
        });
    }

    private createLabel(d: any): Promise<Label> {
        let labelNode = new Node();
        labelNode.layer = Layers.Enum.EDITOR;
        labelNode.addComponent(UITransform);
        let label = labelNode.addComponent(Label);
        label.color = no.str2Color(d.color);
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
        return new Promise<Label>(resolve => {
            no.assetBundleManager.loadFont(d.font, f => {
                if (!label || !label.isValid) return;
                label.font = f;
                resolve(label);
            });
        });
    }

    private drawSpriteFrameToTexture(sf: SpriteFrame, x: number, y: number) {
        let rect = sf.rect.clone();
        if (sf.rotated) {
            const temp = rect.width;
            rect.width = rect.height;
            rect.height = temp;
        }
        let buffer = this.texture?.getTextureBuffer(sf.texture as Texture2D, rect);
        if (sf.rotated) {
            this._rotateImageBuffer(buffer, rect.width, rect.height, false);
            const temp = rect.width;
            rect.width = rect.height;
            rect.height = temp;
        }
        this.texture?.drawTextureBufferAt(buffer, x - rect.width / 2, y - rect.height / 2, rect.width, rect.height);
    }

    private _rotateImageBuffer(buffer: Uint8Array, width: number, height: number, cw = true) {
        var dd = [];
        let length = Math.ceil(buffer.length / 4);
        for (var ii = 0; ii < length; ii++) {
            dd[ii] = [];
            for (var jj = 0; jj < 4; jj++) {
                dd[ii][jj] = buffer[ii * 4 + jj];
            }
        }
        cw && (dd = dd.reverse());
        let bb = [];
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                const [_x, _y] = [y, width - x - 1];
                bb[_y * height + _x] = dd[y * width + x];
            }
        }
        for (var i = 0; i < length; i++) {
            for (var j = 0; j < 4; j++) {
                buffer[i * 4 + j] = bb[i][j];
            }
        }
    }

    private drawTTFSpriteFramesToCanvas(labels: { label: Label, x: number, y: number }[]) {
        labels.forEach(a => {
            this.drawSpriteFrameToTexture(a.label.ttfSpriteFrame, a.x, a.y);
        });
    }

    private drawSpriteFramesToTexture(frames: { frame: SpriteFrame, x: number, y: number }[]) {
        frames.forEach(a => {
            this.drawSpriteFrameToTexture(a.frame, a.x, a.y);
        });
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

    private setSpriteFrame() {
        if (!this || !this.isValid) return;
        let newSf = new SpriteFrame();
        newSf.texture = this.texture;
        newSf._uuid = `${no.sysTime.now}`;
        if (!this?.getComponent(YJDynamicTexture))
            this.getComponent(Sprite).spriteFrame = newSf;
        else
            this?.getComponent(YJDynamicTexture).packSpriteFrame(newSf);
        this.checkShader();
    }

    private checkShader() {
        this.getComponent(SetEffect)?.work();
    }
}
