import { ccclass, macro, requireComponent, Sprite, SpriteAtlas } from '../../common/yj';
import { HackUi } from '../../common/ui/HackUi';
import { no } from '../no';

/**
 * 精灵图集实现序列帧动画,条件是图集的精灵帧命名是纯数字从1开始递增
 * Author mqsy_yj
 * DateTime Wed Jun 11 2025 11:13:42 GMT+0800 (中国标准时间)
 * data: {path:string, time:number, loop?: number, duration?:number}
 * 纹理资源路径，播完一次需要时长,循环播放次数：0无限循环，>0循环次数, 动画持续时长
 */

@ccclass('SetSpriteAtlasAni')
@requireComponent([Sprite])
export class SetSpriteAtlasAni extends HackUi {
    private _curPath: string;
    private _curSpriteAtlas: SpriteAtlas;
    private _sprite: Sprite;
    private _curIndex: number;
    private _sum: number;

    protected onDataChange(data: any) {
        const { path, time, loop, duration } = data;
        if (path && path !== this._curPath) {
            this._curPath = path;
            no.assetBundleManager.decRef(this._curSpriteAtlas);
            this._curSpriteAtlas = null;
        }
        if (!this._sprite) {
            this._sprite = this.getComponent(Sprite);
        }
        if (!this._curPath) {
            this.a_setEmpty();
            return;
        }
        if (!this._curSpriteAtlas) {
            no.assetBundleManager.loadAtlas(this._curPath, atlas => {
                this._curSpriteAtlas = atlas;
                this._sprite.spriteAtlas = atlas;
                this.play(time, loop, duration);
            });
        } else {
            this.play(time, loop, duration);
        }
    }

    private play(time: number, loop: number, duration: number) {
        this.unschedule(this.showSpriteFrame);
        const len = this._curSpriteAtlas.getSpriteFrames().length,
            interval = time / len;
        const repeat = duration ? Math.ceil(duration / interval) : loop <= 0 ? macro.REPEAT_FOREVER : (loop - 1) * len;
        this._curIndex = 1;
        this._sum = len;
        this.schedule(this.showSpriteFrame, interval, repeat);
    }

    private showSpriteFrame() {
        const key = `${this._curIndex}`;
        this._sprite.spriteFrame = this._curSpriteAtlas.getSpriteFrame(key);
        this._curIndex++;
        if (this._curIndex > this._sum) {
            this._curIndex = 1;
        }
    }

    /**如果没需求可以不实现 */
    public a_setEmpty(): void {
        this.unschedule(this.showSpriteFrame);
        this._sprite.spriteAtlas = null;
        this._curPath = null;
        if (this._curSpriteAtlas) {
            no.assetBundleManager.decRef(this._curSpriteAtlas);
            this._curSpriteAtlas = null;
        }
    }
}
