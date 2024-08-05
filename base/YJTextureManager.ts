import { no } from "../no";
import { singleObject } from "../types";
import { ccclass, Texture2D } from "../yj";

@ccclass('YJTextureManager')
@singleObject()
class _YJTextureManager extends no.SingleObject {
    private textureMap: { [key: string]: { texture: Texture2D, ref: number, time: number, size: number } } = {};

    private TextureAllSize: number = 0;
    private static MaxTextureSize: number = 1024 * 1024 * 50; // 200M

    public static get ins(): _YJTextureManager {
        return this.instance();
    }

    public hasTexture(key: string): boolean {
        return !!this.textureMap[key] || no.assetBundleManager.hasImage(key);
    }

    public getTexture(key: string): Texture2D | null {
        const item = this.textureMap[key];
        if (item) {
            ++item.ref;
            return item.texture;
        } else {
            const t = no.assetBundleManager.createTextureFromCache(key);
            this.addTexure(key, t);
            return t;
        }
    }

    public addTexure(key: string, tex: Texture2D): void {
        const format = tex.getGFXTexture()?.format == 89 ? "astc" : "rgba8",
            size = (tex.getGFXTexture()?.size || 0) * (format == "astc" ? 1 : 2);
        this.textureMap[key] = { texture: tex, ref: 1, time: no.sysTime.now, size: size };
        this.TextureAllSize += size; // 更新纹理总大小
        no.warn(`纹理格式及大小：${key} ${format} ${Math.ceil(size / 1024)}K`);
        no.warn(`当前缓存纹理总大小：${Math.ceil(this.TextureAllSize / 1048576)}M`)
        this.releaseTexture();
    }

    public returnTexture(key: string): void {
        const item = this.textureMap[key] || null;
        if (item) {
            --item.ref;
            item.time = no.sysTime.now; // 更新时间戳，用于判断是否需要释放资源
            if (item.ref == 0)
                no.assetBundleManager.deRefCachedImage(key);
            // if (item[1] == 0) {
            //     item[0].destroy(); // 销毁纹理对象
            //     delete this.textureMap[key];// 删除纹理对象
            // }
        }
    }

    private releaseTexture() {
        if (this.TextureAllSize < _YJTextureManager.MaxTextureSize) return;
        no.warn('纹理缓存已超过上限，开始释放较早的纹理');
        const keys = Object.keys(this.textureMap);
        keys.sort((a, b) => this.textureMap[a].time - this.textureMap[b].time);
        for (const key of keys) {
            const item = this.textureMap[key] || null;
            if (item && item.ref === 0) {
                const size = item.size;
                this.TextureAllSize -= size; // 更新纹理总大小
                item.texture.destroy(); // 销毁纹理对象
                delete this.textureMap[key]; // 删除纹理对象
                no.assetBundleManager.removeCachedImage(key);
                no.warn(`释放纹理: ${key} 大小: ${size}`); // 输出日志信息
                if (this.TextureAllSize < _YJTextureManager.MaxTextureSize) break; // 释放到小于等于最大纹理大小后退出循环
            }
        }
    }
}

export const YJTextureManager = _YJTextureManager.ins;
