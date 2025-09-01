import { ccclass, Material, property, Sprite, UIRenderer } from '../../yj';
import { SetEffect } from '../../ui/SetEffect';
import { no } from '../../no';

/**
 * 控制扫光效果的显示，需要配合saoguang.effect使用
 * Author mqsy_yj
 * DateTime Tue Aug 26 2025 11:26:25 GMT+0800 (中国标准时间)
 * data: {loop?:boolean, duration?:number} loop:是否循环，duration:持续时间
 */

@ccclass('SetShowSaoGuang')
export class SetShowSaoGuang extends SetEffect {
    @property({ displayName: '同材质中的Speed' })
    speed: number = 0;
    @property({ type: no.EventHandlerInfo })
    onStart: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo })
    onComplete: no.EventHandlerInfo[] = [];

    private _showSG: boolean = false;
    private _duration: number = 0;
    private _dt: number = 0;

    protected onDataChange(data: any) {
        if (!this._renderComp) {
            this._renderComp = this.getComponent(UIRenderer);
            if (!this._renderComp) return;
        }
        no.EventHandlerInfo.execute(this.onStart);
        const { loop, duration } = data;
        if (loop) {
            this.setProperties(this._renderComp.material, null, { auto: 1.0 });
        } else if (duration) {
            this.setProperties(this._renderComp.material, null, { auto: 0 });
            this._showSG = true;
            this._duration = duration;
            this._dt = 0;
        }
    }

    protected lateUpdate(dt: number): void {
        if (this._showSG) {
            if (this._dt >= this._duration) {
                this._showSG = false;
                no.EventHandlerInfo.execute(this.onComplete);
            } else {
                this.setProperties(this._renderComp.material, null, { aniTime: this._dt % this.speed });
                this._dt += dt * this.speed;
            }
        }
    }

    public a_playOnce() {
        this.a_setData({ loop: false, duration: this.speed });
    }
}
