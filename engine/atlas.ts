import { SpriteFrame, Texture2D, ImageAsset, math, __private, dynamicAtlasManager, js, Component } from "cc";
import { EDITOR, JSB } from "cc/env";
import { no } from "../no";
import { PackedFrameData } from "../types";
import { MaxRects } from "./MaxRects";

export class Atlas {
    public _texture: DynamicAtlasTexture;
    private _maxRect: MaxRects;
    private _dynamicTextureRect: any;
    public readonly uuid: number;
    // private _innerSpriteFrames: SpriteFrame[];

    constructor(width: number, height: number) {
        this.uuid = no.sysTime.now;
        const texture = new DynamicAtlasTexture();
        texture._uuid = `${no.sysTime.now}`;
        texture.initWithSize(width, height);
        this._maxRect = new MaxRects(width, height);
        this._texture = texture;
        this._dynamicTextureRect = {};
        // this._innerSpriteFrames = [];
    }

    public getPackedFrame(uuid: string): PackedFrameData | null {
        let info = this._dynamicTextureRect[uuid];
        if (info) {
            return {
                x: info.x,
                y: info.y,
                w: info.w,
                h: info.h,
                rotate: info.rotate,
                texture: this._texture
            };
        }
        return null;
    }


    /**
     * @en
     * Append a sprite frame into the dynamic atlas.
     *
     * @zh
     * 添加碎图进入动态图集。
     *
     * @method insertSpriteFrame
     * @param spriteFrame  the sprite frame that will be inserted in the atlas.
     */
    public insertSpriteFrame(spriteFrame: SpriteFrame, canRotate: boolean, noSpace: () => void): PackedFrameData {
        // Todo:No renderTexture
        let _uuid = spriteFrame._uuid;
        let packedFrame = this.getPackedFrame(_uuid);
        if (packedFrame) return packedFrame;
        const rect = spriteFrame.rect;

        // let isRotated = canRotate && rect.width > rect.height;

        // let width = isRotated ? rect.height : rect.width,
        //     height = isRotated ? rect.width : rect.height;

        let isRotated = spriteFrame.rotated;


        let width = isRotated ? rect.height : rect.width,
            height = isRotated ? rect.width : rect.height;

        let p = this._maxRect.find(width, height);
        if (!p) {
            noSpace();
            return null;
        }

        let x = p.x, y = p.y;
        // spriteFrame.rotated = isRotated;
        this.drawImageAt(spriteFrame, x, y);
        this.setSpriteFrameTextureRect(_uuid, x, y, width, height, isRotated);
        return {
            x: x,
            y: y,
            w: width,
            h: height,
            rotate: isRotated,
            texture: this._texture
        };
    }

    public drawTexture(texture: Texture2D): PackedFrameData {
        let info = this._dynamicTextureRect[texture._uuid];
        if (info) {
            return null;
        }
        let rotate = false;
        let width = rotate ? texture.height : texture.width;
        let height = rotate ? texture.width : texture.height;
        let p = this._maxRect.find(width, height);
        if (!p || !texture._mipmaps[0]) return null;
        this.setSpriteFrameTextureRect(texture._uuid, p.x, p.y, width, height, false);
        this._setSubImage(texture._mipmaps[0], p.x, p.y);
        return {
            x: p.x,
            y: p.y,
            w: width,
            h: height,
            rotate: false,
            texture: this._texture
        };
    }

    public setSpriteFrameTextureRect(uuid: string, x: number, y: number, w: number, h: number, rotate: boolean) {
        this._dynamicTextureRect[uuid] = {
            x: x,
            y: y,
            w: w,
            h: h,
            rotate: rotate
        };
    }

    public clearTexture(frame: SpriteFrame) {
        let uuid = frame._uuid;
        delete this._dynamicTextureRect[uuid];
        let rect = frame.rect;
        this._maxRect.reuseRect(rect.x, rect.y, rect.width, rect.height);
        let img = this._createEmptyImage(frame.rect);
        this._setSubImage(img, rect.x, rect.y);
    }

    /**
     * @en
     * Reset the dynamic atlas, and destroy the texture of the atlas.
     *
     * @zh
     * 重置该动态图集，并销毁该图集的纹理。
     *
     * @method destroy
    */
    public destroy() {
        this._texture.destroy();
    }

    private drawImageAt(spriteFrame: SpriteFrame, x: number, y: number) {
        let texture = spriteFrame.texture;
        let r = spriteFrame.rect;
        let isRotated = spriteFrame.rotated;
        let rect = math.rect(r.x, r.y, isRotated ? r.height : r.width, isRotated ? r.width : r.height);
        let buffer = this._texture.getTextureBuffer(texture as Texture2D, rect);
        let img = this._createImage(buffer, rect);
        // if (isRotated) img = this._rotateImage(img);
        this._setSubImage(img, x, y);
    }

    private _createEmptyImage(rect: math.Rect): HTMLCanvasElement {
        let canvas = document.createElement('canvas');
        canvas.width = rect.width;
        canvas.height = rect.height;
        let ctx = canvas.getContext("2d");
        let imageData = ctx.createImageData(rect.width, rect.height);
        let i = 0,
            data = imageData.data,
            length = data.length;
        while (i < length) {
            data[i++] = 0;
            data[i++] = 0;
            data[i++] = 0;
            data[i++] = 0;
        }
        ctx.putImageData(imageData, 0, 0);
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

    private _setSubImage(img: HTMLCanvasElement | ImageAsset, x: number, y: number) {
        if (img.width <= 8 || img.height <= 8) {
            this._texture.drawImageAt(img, x - 1, y - 1);
            this._texture.drawImageAt(img, x - 1, y + 1);
            this._texture.drawImageAt(img, x + 1, y - 1);
            this._texture.drawImageAt(img, x + 1, y + 1);
        }

        this._texture.drawImageAt(img, x - 1, y);
        this._texture.drawImageAt(img, x + 1, y);
        this._texture.drawImageAt(img, x, y - 1);
        this._texture.drawImageAt(img, x, y + 1);

        this._texture.drawImageAt(img, x, y);
    }

    private _rotateImage(img: HTMLCanvasElement): HTMLCanvasElement {
        let canvas = document.createElement('canvas');
        canvas.width = img.height;
        canvas.height = img.width;
        let ctx = canvas.getContext("2d");
        ctx.rotate(1.5707963267948966);
        ctx.drawImage(img, 0, -img.height);
        return canvas;
    }
}

export class DynamicAtlasTexture extends Texture2D {
    /**
     * @en
     * Initialize the render texture.
     *
     * @zh
     * 初始化 render texture。
     *
     * @method initWithSize
     */
    public initWithSize(width: number, height: number, format: number = 35) {
        this.reset({
            width,
            height,
            format,
        });
    }

    /**
     * @en
     * Draw a texture to the specified position.
     *
     * @zh
     * 将指定的图片渲染到指定的位置上。
     *
     * @method drawTextureAt
     * @param {Texture2D} image
     * @param {Number} x
     * @param {Number} y
     */
    public drawTextureAt(image: ImageAsset, x: number, y: number) {
        const gfxTexture = this.getGFXTexture();
        if (!image || !gfxTexture) {
            return;
        }

        const gfxDevice = this._getGFXDevice();
        if (!gfxDevice) {
            console.warn('Unable to get device');
            return;
        }

        const region = new BufferTextureCopy();
        region.texOffset.x = x;
        region.texOffset.y = y;
        region.texExtent.width = image.width;
        region.texExtent.height = image.height;
        gfxDevice.copyTexImagesToTexture([image.data as HTMLCanvasElement], gfxTexture, [region]);
    }

    public drawImageAt(image: ImageAsset | HTMLCanvasElement, x: number, y: number) {
        if (image instanceof ImageAsset) {
            this.drawTextureAt(image, x, y);
            return;
        }
        const gfxTexture = this.getGFXTexture();
        if (!image || !gfxTexture) {
            return;
        }

        const gfxDevice = this._getGFXDevice();
        if (!gfxDevice) {
            console.warn('Unable to get device');
            return;
        }

        const region = new BufferTextureCopy();
        region.texOffset.x = x;
        region.texOffset.y = y;
        region.texExtent.width = image.width;
        region.texExtent.height = image.height;
        gfxDevice.copyTexImagesToTexture([image], gfxTexture, [region]);
    }

    public getTextureBuffer(texture: Texture2D, rect: math.Rect): ArrayBufferView {
        const gfxTexture = texture.getGFXTexture();
        if (!gfxTexture) {
            return;
        }
        const gfxDevice = this._getGFXDevice();
        if (!gfxDevice) {
            console.warn('Unable to get device');
            return;
        }
        let buffer = new Uint8Array(rect.width * rect.height * 4);
        const bufferViews: ArrayBufferView[] = [buffer];
        const region = new BufferTextureCopy();
        region.texOffset.x = rect.x;
        region.texOffset.y = rect.y;
        region.texExtent.width = rect.width;
        region.texExtent.height = rect.height;
        gfxDevice.copyTextureToBuffers(gfxTexture, bufferViews, [region]);
        return buffer;
    }
}

export class BufferTextureCopy {
    declare private _token: never; // to make sure all usages must be an instance of this exact class, not assembled from plain object

    constructor(
        public buffStride: number = 0,
        public buffTexHeight: number = 0,
        public texOffset: Offset = new Offset(),
        public texExtent: Extent = new Extent(),
        public texSubres: TextureSubresLayers = new TextureSubresLayers(),
    ) { }

    public copy(info: Readonly<BufferTextureCopy>) {
        this.buffStride = info.buffStride;
        this.buffTexHeight = info.buffTexHeight;
        this.texOffset.copy(info.texOffset);
        this.texExtent.copy(info.texExtent);
        this.texSubres.copy(info.texSubres);
        return this;
    }
}

export class Offset {
    declare private _token: never; // to make sure all usages must be an instance of this exact class, not assembled from plain object

    constructor(
        public x: number = 0,
        public y: number = 0,
        public z: number = 0,
    ) { }

    public copy(info: Readonly<Offset>) {
        this.x = info.x;
        this.y = info.y;
        this.z = info.z;
        return this;
    }
}

export class Extent {
    declare private _token: never; // to make sure all usages must be an instance of this exact class, not assembled from plain object

    constructor(
        public width: number = 0,
        public height: number = 0,
        public depth: number = 1,
    ) { }

    public copy(info: Readonly<Extent>) {
        this.width = info.width;
        this.height = info.height;
        this.depth = info.depth;
        return this;
    }
}

export class TextureSubresLayers {
    declare private _token: never; // to make sure all usages must be an instance of this exact class, not assembled from plain object

    constructor(
        public mipLevel: number = 0,
        public baseArrayLayer: number = 0,
        public layerCount: number = 1,
    ) { }

    public copy(info: Readonly<TextureSubresLayers>) {
        this.mipLevel = info.mipLevel;
        this.baseArrayLayer = info.baseArrayLayer;
        this.layerCount = info.layerCount;
        return this;
    }
}

//关闭自动合图
dynamicAtlasManager.enabled = false;
js.mixin(dynamicAtlasManager, {
    packToDynamicAtlas(comp: Component, frame: SpriteFrame) {
        if (EDITOR) return;
        if (frame?.original) return;
        let a: any = comp.getComponent('YJDynamicTexture');
        if (!a && comp.node.parent?.getComponent('cc.RichText') && comp.node.parent?.getComponent('YJDynamicTexture')) {
            a = comp.addComponent('YJDynamicTexture');
            (a as any).dynamicAtlas = (comp.node.parent.getComponent('YJDynamicTexture') as any).dynamicAtlas;
            a.setCommonMaterial();
        }
        a?.pack();
    }
});