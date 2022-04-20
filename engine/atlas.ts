import { SpriteFrame, Texture2D, ImageAsset, director, WebGL2Device, math } from "cc";
import { MaxRects } from "./MaxRects";

export class Atlas {
    private _texture: DynamicAtlasTexture;
    private _maxRect: MaxRects;
    private _dynamicTextureRect: any;
    // private _innerSpriteFrames: SpriteFrame[];

    constructor(width: number, height: number) {
        const texture = new DynamicAtlasTexture();
        texture.initWithSize(width, height);
        this._maxRect = new MaxRects(width, height);
        this._texture = texture;
        this._dynamicTextureRect = {};
        // this._innerSpriteFrames = [];
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
    public insertSpriteFrame(spriteFrame: SpriteFrame) {
        // Todo:No renderTexture
        let _uuid = spriteFrame._uuid;
        let info = this._dynamicTextureRect[_uuid];
        if (info) {
            return {
                x: info.x,
                y: info.y,
                texture: this._texture
            };
        }

        const rect = spriteFrame.rect;
        let isRotated = spriteFrame.rotated;


        let width = isRotated ? rect.height : rect.width,
            height = isRotated ? rect.width : rect.height;

        let p = this._maxRect.find(width, height);
        if (!p) {
            console.log('动态图集无空间！');
            return null;
        }
        let x = p.x, y = p.y;

        this.drawImageAt(spriteFrame, x, y);

        this._dynamicTextureRect[_uuid] = {
            x: x,
            y: y
        };
        const frame = {
            x: x,
            y: y,
            texture: this._texture
        }

        // this._innerSpriteFrames.push(spriteFrame);
        return frame;
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
        let image: ImageAsset = texture['_mipmaps'][0];
        if (image && image.width == r.width && image.height == r.height) {
            this._setSubImage(image, x, y);
        } else {
            let isRotated = spriteFrame.rotated;
            let rect = math.rect(r.x, r.y, isRotated ? r.height : r.width, isRotated ? r.width : r.height);
            if (typeof createImageBitmap !== 'undefined' && image) {
                createImageBitmap(image.data as HTMLCanvasElement, rect.x, rect.y, rect.width, rect.height).then(img => {
                    this._setSubImage(img, x, y);
                });
            } else {
                let img = this._createImageData(texture, rect);
                this._setSubImage(img, x, y);
            }
        }
    }

    private _setSubImage(img, x, y) {
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

    private _createImageData(texture, rect) {
        let input = this._getPixels(rect, texture);
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let imageData = ctx.createImageData(rect.width, rect.height);
        let i = 0,
            k = 0,
            data = imageData.data,
            length = data.length;
        while (i < length) {
            data[i++] = input[k++];
            data[i++] = input[k++];
            data[i++] = input[k++];
            data[i++] = input[k++];
        }
        return imageData;
    }
    //读取texture一定区域内的像素数据
    private _getPixels(rect, texture) {

        const gl = (director.root.device as WebGL2Device).gl;
        let framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._texture._glID, 0);

        let pixels = new Uint8Array(rect.width * rect.height * 4);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
            gl.readPixels(rect.x, rect.y, rect.width, rect.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        }

        gl.deleteFramebuffer(framebuffer);

        return pixels;
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

    public drawImageAt(image: ImageAsset | ImageBitmap, x: number, y: number) {
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