import { no } from "../no";
import { singleObject } from "../types";
import { ccclass, Texture2D } from "../yj";

@ccclass('YJTextureManager')
@singleObject()
class _YJTextureManager extends no.SingleObject {
    /** 纹理缓存映射表 key:资源路径 value:纹理资源对象 */
    private textureMap: { [key: string]: { texture: Texture2D, ref: number, time: number, size: number } } = {};

    /** 当前缓存的纹理总大小（字节） */
    private TextureAllSize: number = 0;
    /** 最大允许缓存纹理大小（50MB） */
    private static MaxTextureSize: number = 1024 * 1024 * 50; // 200M

    /**
     * 获取单例实例
     * @example
     * // 获取管理器实例
     * const textureMgr = YJTextureManager.ins;
     */
    public static get ins(): _YJTextureManager {
        return this.instance() as _YJTextureManager;
    }

    /**
     * 检查纹理是否已缓存或存在资源包中
     * @param key 纹理资源路径
     * @returns 是否存在可用纹理
     * @example
     * // 检查角色头像是否已缓存
     * if(YJTextureManager.ins.hasTexture('avatar/hero')) {
     *     // 执行预加载完成后的逻辑
     * }
     */
    public hasTexture(key: string): boolean {
        return !!this.textureMap[key] || no.assetBundleManager.hasImage(key);
    }

    /**
     * 获取纹理资源（自动管理引用计数）
     * @param key 纹理资源路径
     * @returns 纹理对象或null
     * @example
     * // 获取并显示角色头像
     * const texture = YJTextureManager.ins.getTexture('avatar/hero');
     * if(texture) sprite.spriteFrame = new SpriteFrame(texture);
     * 
     * // 配合异步加载使用
     * no.assetBundleManager.loadImage('bg/main', () => {
     *     const bgTex = YJTextureManager.ins.getTexture('bg/main');
     * });
     */
    public getTexture(key: string): Texture2D | null {
        const item = this.textureMap[key];
        if (item) {
            ++item.ref;
            return item.texture;
        } else {
            const t = no.assetBundleManager.getTextureFromCache(key);
            this.addTexure(key, t);
            return t;
        }
    }

    /**
     * 添加纹理到缓存（自动计算内存占用）
     * @param key 纹理资源路径
     * @param tex 纹理对象
     * @example
     * // 预加载并缓存纹理
     * no.assetBundleManager.loadImage('effect/fire', (tex) => {
     *     YJTextureManager.ins.addTexure('effect/fire', tex);
     * });
     */
    public addTexure(key: string, tex: Texture2D): void {
        const format = tex.getGFXTexture()?.format == 89 ? "astc" : "rgba8",
            size = (tex.getGFXTexture()?.size || 0) * (format == "astc" ? 1 : 2);
        this.textureMap[key] = { texture: tex, ref: 1, time: no.sysTime.now, size: size };
        this.TextureAllSize += size;
        no.warn(`纹理格式及大小：${key} ${format} ${Math.ceil(size / 1024)}K`);
        no.warn(`当前缓存纹理总大小：${Math.ceil(this.TextureAllSize / 1048576)}M`)
        this.releaseTexture();
    }

    /**
     * 归还纹理引用（减少引用计数）
     * @param key 纹理资源路径
     * @example
     * // 当不再需要某个纹理时
     * YJTextureManager.ins.returnTexture('avatar/hero');
     * 
     * // 界面关闭时归还所有使用纹理
     * onClose() {
     *     this.usedTextures.forEach(t => YJTextureManager.ins.returnTexture(t));
     * }
     */
    public returnTexture(key: string): void {
        const item = this.textureMap[key] || null;
        if (item) {
            --item.ref;
            item.time = no.sysTime.now;
            if (item.ref == 0)
                no.assetBundleManager.deRefCachedImage(key);
        }
    }

    /**
     * 执行纹理资源释放（当总大小超过限制时）
     * @description 释放策略：
     * 1. 按最后使用时间排序（最早优先）
     * 2. 仅释放引用计数为0的纹理
     * 3. 释放后总大小低于限制时停止
     */
    private releaseTexture() {
        if (this.TextureAllSize < _YJTextureManager.MaxTextureSize) return;
        no.warn('纹理缓存已超过上限，开始释放较早的纹理');
        const keys = Object.keys(this.textureMap);
        keys.sort((a, b) => this.textureMap[a].time - this.textureMap[b].time);
        for (let i = 0, n = keys.length; i < n; i++) {
            let key = keys[i];
            let item = this.textureMap[key] || null;
            if (item && item.ref === 0) {
                let size = item.size;
                this.TextureAllSize -= size;
                item.texture.destroy();
                delete this.textureMap[key];
                no.assetBundleManager.removeCachedImage(key);
                no.warn(`释放纹理: ${key} 大小: ${size}`);
                if (this.TextureAllSize < _YJTextureManager.MaxTextureSize) break;
            }
        }
    }
}

export const YJTextureManager = _YJTextureManager.ins;
