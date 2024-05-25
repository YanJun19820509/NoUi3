import { EffectAsset, Material, Sprite, SpriteFrame, ccclass, game, requireComponent, sys, v2 } from '../../../NoUi3/yj';
import { no } from '../../no';
import { FuckUi } from '../FuckUi';

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
export class SetFrameAnimation extends FuckUi {

    private _spriteFrame: SpriteFrame | null = null;

    onDestroy() {
        if (this._spriteFrame) {
            this._spriteFrame.decRef();
            this._spriteFrame = null;
        }
        this.unschedule(this.aniEnd);
    }

    protected async onDataChange(data: any) {
        if (data.path) {
            await this.setSpriteFrame(data.path);
        }
        this.setProperties(data.cells, data.speed);
        this.setLoop(data.loop, data.cells, data.speed);
    }

    private async setSpriteFrame(path: string) {
        return new Promise<void>(resolve => {
            path = path.replace('.png', '') + '/spriteFrame';
            no.assetBundleManager.loadSprite(path, spriteFrame => {
                if (!spriteFrame) {
                    no.err('setSingleSpriteFrame no file', name);
                } else {
                    if (!this.isValid) {
                        return;
                    }
                    if (this._spriteFrame) {
                        this._spriteFrame.decRef();
                        this._spriteFrame = null;
                    }
                    this._spriteFrame = spriteFrame;
                    const sprite = this.getComponent(Sprite);
                    sprite.spriteFrame = spriteFrame;
                }
                resolve();
            });
        });
    }

    private setProperties(cells: number[], speed: number) {
        const material = this.getMaterial();
        material.recompileShaders({ 'IS_SWITCH': true, 'USE_ALPHA_TEST': true });
        material.setProperty('cells', v2(cells[0], cells[1]));
        material.setProperty('fps', cells[0] * cells[1] / speed);
        const a = -game.totalTime / 1000;
        material.setProperty('startTime', a);
    }

    private setLoop(loop: number, cells: number[], speed: number) {
        this.unschedule(this.aniEnd);
        if (loop > 0) {
            const time = loop * speed;
            this.scheduleOnce(this.aniEnd, time);
        }
    }

    private aniEnd() {
        const material = this.getMaterial();
        material.recompileShaders({ 'IS_SWITCH': false });
    }

    private getMaterial() {
        const sprite = this.getComponent(Sprite);
        if (sprite.material.effectName != '../NoUi3/effect/switch') {
            let material = new Material();
            const effectAsset = EffectAsset.get('../NoUi3/effect/switch');
            if (effectAsset) {
                material.initialize({
                    effectAsset: effectAsset
                });
                sprite.material = material;
            } else {
                no.err('../NoUi3/effect/switch 未加载')
            }
        }
        return sprite.material;
    }
}
