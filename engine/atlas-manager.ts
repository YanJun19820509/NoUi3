import { SpriteFrame } from "cc";
import { EDITOR } from "cc/env";
import { Atlas } from "./atlas";


export class DynamicAtlasManager {
    public static instance: DynamicAtlasManager;

    private _atlases: Atlas[] = [];
    private _atlasIndex = -1;

    private _maxAtlasCount = 5;
    private _textureSize = 2048;

    private newAtlas () {
        let atlas = this._atlases[++this._atlasIndex];
        if (!atlas) {
            atlas = new Atlas(this._textureSize, this._textureSize);
            this._atlases.push(atlas);
        }
        return atlas;
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
    public insertSpriteFrame (spriteFrame) {
        if (EDITOR) return null;
        if ( this._atlasIndex === this._maxAtlasCount
            || !spriteFrame || spriteFrame._original) return null;

        if (!spriteFrame.packable) return null;

        // hack for pixel game,should pack to different sampler atlas
        // const sampler = spriteFrame.texture.getSamplerInfo();
        // if (sampler.minFilter !== 2 || sampler.magFilter !== 2 || sampler.mipFilter !== 0) {
        //     return null;
        // }

        let atlas = this._atlases[this._atlasIndex];
        if (!atlas) {
            atlas = this.newAtlas();
        }

        const frame = atlas.insertSpriteFrame(spriteFrame);
        if (!frame && this._atlasIndex !== this._maxAtlasCount) {
            atlas = this.newAtlas();
            return atlas.insertSpriteFrame(spriteFrame);
        }
        return frame;
    }

    /**
     * @en
     * Pack the sprite in the dynamic atlas and update the atlas information of the sprite frame.
     *
     * @zh
     * 将图片打入动态图集，并更新该图片的图集信息。
     *
     * @method packToDynamicAtlas
     * @param frame  the sprite frame that will be packed in the dynamic atlas.
     */
    public packToDynamicAtlas (comp, frame: SpriteFrame) {
        if (EDITOR) return;

        if (frame && !frame.original && frame.packable && frame.texture && frame.texture.width > 0 && frame.texture.height > 0) {
            const packedFrame = this.insertSpriteFrame(frame);
            if (packedFrame) {
                frame._setDynamicAtlasFrame(packedFrame);
            }
        }
    }
}

