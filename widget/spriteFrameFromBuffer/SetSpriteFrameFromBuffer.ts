import { DynamicAtlasTexture } from '../../engine/atlas';
import { no } from '../../no';
import { HackUi } from '../../ui/HackUi';
import { Asset, BufferAsset, ccclass, EDITOR, property, Rect, requireComponent, Sprite, SpriteFrame, Texture2D } from '../../yj';
/**
 * 读取buffer文件中的数据并创建spriteFrame,buffer文件格式为dat
 */
@ccclass('SetSpriteFrameFromBuffer')
@requireComponent(Sprite)
export class SetSpriteFrameFromBuffer extends HackUi {
    @property({ displayName: '导出buffer' })
    get exportBuffer(): boolean {
        return false;
    }
    set exportBuffer(v: boolean) {
        if (!EDITOR) return;
        if (v) {
            const sprite = this.getComponent(Sprite);
            if (!sprite.spriteFrame) return;
            const texture = sprite.spriteFrame.texture as Texture2D;
            const size = { width: texture.width, height: texture.height };
            const dat = new DynamicAtlasTexture();
            dat.initWithSize(size.width, size.height);
            const buffer = dat.getTextureBuffer(texture, new Rect(0, 0, size.width, size.height));
            no.saveDataToFile(buffer, `${sprite.spriteFrame.name}_buffer.bin`);
        }
    }

    private _spriteFrame: SpriteFrame | null = null;

    protected onDataChange(data: any): void {
        const { path, size } = data;
        no.assetBundleManager.loadBuffer(path, asset => this.setSpriteFrame(size, asset));
    }

    protected onDestroy(): void {
        this._spriteFrame?.destroy();
        this._spriteFrame = null;
    }

    private setSpriteFrame(size: { width: number, height: number }, bufferAsset: BufferAsset) {
        let buffer = no.ArrayBuffer2Uint8Array(bufferAsset.buffer());
        const sprite = this.getComponent(Sprite);
        const texture = new DynamicAtlasTexture();
        texture.initWithSize(size.width, size.height);
        texture.uploadData(buffer);
        this._spriteFrame?.destroy();
        this._spriteFrame = new SpriteFrame();
        this._spriteFrame.texture = texture;
        sprite.spriteFrame = this._spriteFrame;
        bufferAsset.decRef();
        buffer = null;
    }
}

