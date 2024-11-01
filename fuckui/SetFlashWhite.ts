
import { ccclass, property, menu, requireComponent, executeInEditMode, EDITOR, UIRenderer, Sprite } from '../yj';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
import { no } from '../no';
import { YJVertexColorTransition } from 'NoUi3/engine/YJVertexColorTransition';

/**
 * Predefined variables
 * Name = SetFlashWhite
 * DateTime = Mon Jan 17 2022 10:47:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetFlashWhite.ts
 * FileBasenameNoExtension = SetFlashWhite
 * URL = db://assets/Script/NoUi3/fuckui/SetFlashWhite.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetFlashWhite')
@menu('NoUi/ui/SetFlashWhite(设置闪白:bool)')
@requireComponent(YJVertexColorTransition)
@executeInEditMode()
export class SetFlashWhite extends FuckUi {
    @property({ displayName: '影响子节点' })
    recursive: boolean = false;
    @property
    autoSetChildren: boolean = false;

    @property
    duration: number = 0.4;

    _time: number = 0;

    protected onDataChange(data: any) {
        data = Boolean(data);
        this.SetFlashWhite(data);
    }

    private _num = 30;
    private SetFlashWhite(v: boolean) {
        let a = this.getComponent(UIRenderer);
        if (a) {
            if (!a.customMaterial) {
                if (this._num > 0) {
                    this._num--;
                    this.scheduleOnce(() => {
                        this.SetFlashWhite(v);
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
                child.getComponent(SetFlashWhite)?.setData(v);
            });
        }
    }

    private setProgressByFrame(dt: number) {
        if (this._time > 0) {
            this._time -= dt;

            this._time = this._time < 0 ? 0 : this._time;
            let rate = Math.abs(this._time - (this.duration / 2)) * 2 / this.duration;
            this.getComponent(YJVertexColorTransition).setEffect({ '0-8': true }, [rate]);
        } else {
            no.unschedule(this, this.setProgressByFrame);
        }
    }

    public a_play() {
        this.SetFlashWhite(true);
    }

    update() {
        if (!EDITOR) return;
        if (!this.autoSetChildren) return;
        this.autoSetChildren = false;

        if (this.recursive) {
            this.getComponentsInChildren(UIRenderer).forEach(child => {
                const a = (child.getComponent(SetFlashWhite) || child.addComponent(SetFlashWhite));
                a.saveIgnore = this.saveIgnore;
                a.duration = this.duration;
            });
        }
    }
}
