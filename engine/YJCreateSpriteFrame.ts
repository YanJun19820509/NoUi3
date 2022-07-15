
import { _decorator, Component, Node, Sprite, SpriteFrame, math, Texture2D, Enum, Size, v2, Vec2 } from 'cc';
import { AlignType } from '../types';
import { DynamicAtlasTexture } from './atlas';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = YJCreateSpriteFrame
 * DateTime = Thu Jun 30 2022 10:23:50 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCreateSpriteFrame.ts
 * FileBasenameNoExtension = YJCreateSpriteFrame
 * URL = db://assets/NoUi3/engine/YJCreateSpriteFrame.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJCreateSpriteFrame')
@requireComponent(Sprite)
export class YJCreateSpriteFrame extends Component {
    @property({ type: Enum(AlignType) })
    align: AlignType = AlignType.None;
    @property
    offset: Vec2 = v2();

    public useSpriteFrames(sfs: SpriteFrame[], uuid: string): void {
        if (sfs.length > 0) {
            let size = this.getSize(sfs);
            let texture = new DynamicAtlasTexture();
            texture.initWithSize(size.width, size.height);
            let newSf = new SpriteFrame();
            newSf.texture = texture;
            newSf._uuid = uuid;
            this.getComponent(Sprite).spriteFrame = newSf;
            
            let img = this.createImage(texture, sfs);
            texture.drawImageAt(img, 0, 0);
        } else
            this.getComponent(Sprite).spriteFrame = null;
    }

    private getSize(sfs: SpriteFrame[]): Size {
        let size = new Size();
        sfs.forEach((sf, i) => {
            switch (this.align) {
                case AlignType.Top:
                case AlignType.Bottom:
                case AlignType.Middle:
                    size.width += sf.rect.width + (i > 0 ? this.offset.x : 0);
                    size.height = Math.max(size.height, sf.rect.height);
                    break;
                case AlignType.Left:
                case AlignType.Right:
                case AlignType.Center:
                    size.width = Math.max(size.width, sf.rect.width);
                    size.height += sf.rect.height + (i > 0 ? this.offset.y : 0);
                    break;
                default:
                    size.width += sf.rect.width + (i > 0 ? this.offset.x : 0);
                    size.height += sf.rect.height + (i > 0 ? this.offset.y : 0);
                    break;
            }
        });
        return size;
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

    private createImage(texture: DynamicAtlasTexture, sfs: SpriteFrame[]): HTMLCanvasElement {
        let width = texture.width, height = texture.height;
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext("2d");

        let x = 0, y = 0, sx = 0, sy = 0;
        sfs.forEach(sf => {
            let rect = sf.rect;
            let buffer = texture.getTextureBuffer(sf.texture as Texture2D, rect);
            let img = this._createImage(buffer, rect);
            switch (this.align) {
                case AlignType.Top:
                    sx = rect.width + this.offset.x;
                    break;
                case AlignType.Bottom:
                    sx = rect.width + this.offset.x;
                    y = height - rect.height;
                    break;
                case AlignType.Middle:
                    sx = rect.width + this.offset.x;
                    y = (height - rect.height) / 2;
                    break;
                case AlignType.Left:
                    sy = rect.height + this.offset.y;
                    break;
                case AlignType.Right:
                    x = width - rect.width;
                    sy = rect.height + this.offset.y;
                    break;
                case AlignType.Center:
                    x = (width - rect.width) / 2;
                    sy = rect.height + this.offset.y;
                    break;
                default:
                    sx = rect.width + this.offset.x;
                    sy = rect.height + this.offset.y;
                    break;
            }
            ctx.drawImage(img, x, y);
            x += sx;
            y += sy;
        });
        return canvas;
    }
}
