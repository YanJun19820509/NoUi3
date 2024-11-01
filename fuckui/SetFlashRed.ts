
import { ccclass, property, menu, requireComponent, executeInEditMode, EDITOR, UIRenderer, Sprite } from '../yj';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
import { no } from '../no';
import { YJVertexColorTransition } from 'NoUi3/engine/YJVertexColorTransition';

/**
 * Predefined variables
 * Name = SetFlashRed
 * DateTime = Mon Jan 17 2022 10:47:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetFlashRed.ts
 * FileBasenameNoExtension = SetFlashRed
 * URL = db://assets/Script/NoUi3/fuckui/SetFlashRed.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetFlashRed')
@menu('NoUi/ui/SetFlashRed(设置闪红:bool)')
@requireComponent(YJVertexColorTransition)
@executeInEditMode()
export class SetFlashRed extends FuckUi {
    @property({ displayName: '影响子节点' })
    recursive: boolean = false;
    @property
    autoSetChildren: boolean = false;

    @property
    duration: number = 0.4;

    _time: number = 0;

    protected onDataChange(data: any) {
        data = Boolean(data);
        this.SetFlashRed(data);
    }

    private _num = 30;
    private SetFlashRed(v: boolean) {
        let a = this.getComponent(UIRenderer);
        if (a) {
            if (!a.customMaterial) {
                if (this._num > 0) {
                    this._num--;
                    this.scheduleOnce(() => {
                        this.SetFlashRed(v);
                    });
                    return;
                }
            } else {
                this._time = this.duration;
                no.scheduleForever(this.setProgressByFrame, 0, this);
            }
        }
        if (this.recursive) {
            this.getComponentsInChildren(UIRenderer).forEach(child => {
                if (a?.uuid == child.uuid) return;
                child.getComponent(SetFlashRed)?.setData(v);
            });
        }
    }

    private setProgressByFrame(dt: number) {
        if (this._time > 0) {
            this._time -= dt;

            this._time = this._time < 0 ? 0 : this._time;
            let rate = Math.abs(this._time - (this.duration / 2)) * 2 / this.duration;
            this.getComponent(YJVertexColorTransition).setEffect({ '0-9': true }, [rate]);
        } else {
            no.unschedule(this, this.setProgressByFrame);
        }
    }

    public a_play() {
        this.SetFlashRed(true);
    }

    update() {
        if (!EDITOR) return;
        if (!this.autoSetChildren) return;
        this.autoSetChildren = false;

        if (this.recursive) {
            this.getComponentsInChildren(UIRenderer).forEach(child => {
                const a = (child.getComponent(SetFlashRed) || child.addComponent(SetFlashRed));
                a.saveIgnore = this.saveIgnore;
                a.duration = this.duration;
            });
        }
    }
}
