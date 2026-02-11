import { EffectAsset, Material, Sprite, SpriteFrame, ccclass, game, requireComponent, sys, v2 } from '../../yj';
import { no } from '../../no';
import { HackUi } from '../HackUi';
import { assetUtils } from '@hackUi/extend/assetUtils';

/**
 * 
 * Author mqsy_yj
 * DateTime Tue May 14 2024 16:07:29 GMT+0800 (中国标准时间)
 * shader实现序列帧动画
 * data: {path:string, cells:number[], speed:number, loop: number}
 * 纹理资源路径，[列数，行数]，播完一次需要时长,循环播放次数：0无限循环，>0循环次数
 */

@ccclass('SetFrameAnimation')
@requireComponent([Sprite])
/**
 * Shader实现的序列帧动画组件
 * 使用示例：
 * data = {
 *   path: 'textures/role',  // 纹理资源路径（自动添加/spriteFrame后缀）
 *   cells: [8, 4],         // 列数x行数 
 *   speed: 2,              // 完整播放一次动画所需时间（秒）
 *   loop: 3                // 循环次数（0=无限循环）
 * }
 */
export class SetFrameAnimation extends HackUi {
    /** 当前使用的精灵帧缓存 */
    private _spriteFrame: SpriteFrame | null = null;

    /** 组件销毁时释放资源 */
    onDestroy() {
        if (this._spriteFrame) {
            this._spriteFrame.decRef(); // 减少引用计数
            this._spriteFrame = null;
        }
        this.unschedule(this.aniEnd); // 取消未执行的动画结束回调
    }

    /**
     * 数据变更处理入口
     * @param data 配置数据 {
     *   path?: string,      // 可选，精灵帧路径
     *   cells: number[],    // 必填，[列数, 行数]
     *   speed: number,      // 必填，动画播放速度
     *   loop: number        // 必填，循环次数
     * }
     */
    protected async onDataChange(data: any) {
        if (data.path) {
            // 需要加载新纹理的情况
            this.setSpriteFrame(data);
        } else {
            // 直接使用现有纹理的情况
            this.setProperties(data.cells, data.speed);
            this.setLoop(data.loop, data.cells, data.speed);
        }
    }

    /**
     * 加载并设置精灵帧
     * @param data 包含path的配置数据
     * 示例：加载 textures/role/spriteFrame
     */
    private setSpriteFrame(data: any) {
        const path = data.path.replace('.png', '') + '/spriteFrame';
        assetUtils.assetBundleManager.loadSprite(path, spriteFrame => {
            if (!spriteFrame) {
                no.err('setSingleSpriteFrame no file', path);
            } else {
                if (!this.isValid) return; // 组件已失效时中止

                // 释放旧纹理资源
                if (this._spriteFrame) {
                    this._spriteFrame.decRef();
                    this._spriteFrame = null;
                }

                // 设置新纹理并初始化动画参数
                this._spriteFrame = spriteFrame;
                const sprite = this.getComponent(Sprite);
                sprite.spriteFrame = spriteFrame;
                this.setProperties(data.cells, data.speed);
                this.setLoop(data.loop, data.cells, data.speed);
            }
        });
    }

    /**
     * 设置材质动画参数
     * @param cells [列数, 行数] 示例：[8,4] 表示8列4行
     * @param speed 完整播放一次动画所需时间（秒）
     * 计算逻辑：总帧数 = 列 * 行，帧率 = 总帧数 / 时长
     */
    private setProperties(cells: number[], speed: number) {
        const material = this.getMaterial();
        // 启用shader动画开关和透明度测试
        material.recompileShaders({ 'IS_SWITCH': true, 'USE_ALPHA_TEST': true });
        material.setProperty('cells', v2(cells[0], cells[1])); // 设置行列数
        material.setProperty('fps', cells[0] * cells[1] / speed); // 计算帧率
        material.setProperty('startTime', -game.totalTime / 1000); // 基于游戏时间计算起始时间
    }

    /**
     * 设置动画循环逻辑
     * @param loop 循环次数（0=无限循环）
     * @param cells 列行数（用于计算总时长）
     * @param speed 单次播放时长（秒）
     */
    private setLoop(loop: number, cells: number[], speed: number) {
        this.unschedule(this.aniEnd);
        if (loop > 0) {
            // 有限次循环：总时长 = 循环次数 * 单次时长
            const time = loop * speed;
            this.scheduleOnce(this.aniEnd, time);
        }
    }

    /** 动画结束回调（关闭shader动画开关） */
    private aniEnd() {
        const material = this.getMaterial();
        material.recompileShaders({ 'IS_SWITCH': false });
    }

    /** 获取/创建专用材质 */
    private getMaterial() {
        const sprite = this.getComponent(Sprite);
        if (sprite.material.effectName != '../common/effect/switch') {
            let material = new Material();
            const effectAsset = EffectAsset.get('../common/effect/switch');
            if (effectAsset) {
                material.initialize({ effectAsset: effectAsset });
                sprite.material = material;
            } else {
                no.err('../common/effect/switch 未加载');
            }
        }
        return sprite.material;
    }
}
