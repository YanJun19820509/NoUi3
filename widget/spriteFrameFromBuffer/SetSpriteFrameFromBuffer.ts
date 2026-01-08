import { DynamicAtlasTexture } from '../../engine/atlas';
import { no } from '../../no';
import { decompress } from '../../pako/YJCompress';
import { HackUi } from '../../ui/HackUi';
import { BufferAsset, ccclass, executeInEditMode, property, requireComponent, Size, Sprite, SpriteFrame } from '../../yj';
/**
 * 读取buffer文件中的数据并创建spriteFrame,buffer文件格式为dat
 */
@ccclass('SetSpriteFrameFromBuffer')
@requireComponent(Sprite)
@executeInEditMode()
export class SetSpriteFrameFromBuffer extends HackUi {
    @property({ displayName: '图片大小', editorOnly: true })
    size: Size = new Size(100, 100);
    @property({ type: BufferAsset, displayName: '图片buffer' })
    get imageBuffer(): BufferAsset {
        return null;
    }
    set imageBuffer(asset: BufferAsset) {
        let buffer = decompress(asset.buffer());
        if (!buffer) return;
        this.setSpriteFrame(this.getComponent(Sprite), this.size, buffer);
    }

    private _spriteFrame: SpriteFrame | null = null;

    protected onDataChange(data: any): void {
        const { path, size } = data;
        no.assetBundleManager.loadBuffer(path, asset => {
            let buffer = decompress(asset.buffer());
            this.setSpriteFrame(this.getComponent(Sprite), size, buffer);
            asset.decRef();
            buffer = null;
        });
    }

    protected onDestroy(): void {
        this._spriteFrame?.destroy();
        this._spriteFrame = null;
    }

    private setSpriteFrame(sprite: Sprite, size: { width: number, height: number }, buffer: Uint8Array) {
        const texture = new DynamicAtlasTexture();
        texture.initWithSize(size.width, size.height);
        texture.uploadData(buffer);
        this._spriteFrame?.destroy();
        this._spriteFrame = new SpriteFrame();
        this._spriteFrame.texture = texture;
        sprite.spriteFrame = this._spriteFrame;
    }
}

