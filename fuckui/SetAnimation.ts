
import { _decorator, AnimationClip, Animation } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SetAnimation
 * DateTime = Mon Jan 17 2022 09:59:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetAnimation.ts
 * FileBasenameNoExtension = SetAnimation
 * URL = db://assets/Script/NoUi3/fuckui/SetAnimation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetAnimation')
export class SetAnimation extends FuckUi {
    @property({ type: no.EventHandlerInfo, displayName: '播放开始前的回调' })
    beforeStartHandlers: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '播放完成后的回调' })
    afterEndHandlers: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '帧事件触发的回调' })
    eventHandlers: no.EventHandlerInfo[] = [];

    private needReleaseClips: AnimationClip[] = [];

    onDisable() {
        let ani = this.getComponent(Animation);
        let n = this.needReleaseClips.length;
        while (n-- > 0) {
            let clip = this.needReleaseClips.shift();
            ani.removeState(clip.name);
            no.assetBundleManager.decRef(clip);
        }
    }

    protected async onDataChange(data: any) {
        let ani = this.getComponent(Animation);
        await no.waitFor(() => { return ani.enabled; });
        let { path, name, repeat } = data;

        if (name) {
            if (!ani.getState(name) && path) {
                await this._loadClip(path, name);
            }
            this._play(name, repeat);
        }
    }

    private async _loadClip(path: string, name: string): Promise<void> {
        return new Promise<void>(resolve => {
            no.assetBundleManager.loadAnimationClip(path, (clip) => {
                no.addToArray(this.needReleaseClips, clip);
                this.getComponent(Animation).createState(clip, name);
                resolve();
            });
        });
    }

    private _play(name: string, repeat?: number) {
        let ani: Animation = this.getComponent(Animation);
        let state = ani.getState(name);
        if (repeat == 0) {
            state?.stop();
            return;
        }
        if (state) {
            ani.on(Animation.EventType.PLAY, this.onPlay, this);
            ani.on(Animation.EventType.FINISHED, this.onFinished, this);
            if (repeat == null || repeat == -1)
                repeat = 999;
            state.wrapMode = AnimationClip.WrapMode.Loop;
            state.repeatCount = repeat;
            state.play();
        }
    }

    private onPlay() {
        no.EventHandlerInfo.execute(this.beforeStartHandlers);
    }

    private onFinished() {
        no.EventHandlerInfo.execute(this.afterEndHandlers);
    }

    public onFrameEvent(v: any): void {
        no.EventHandlerInfo.execute(this.eventHandlers, v);
    }
}
