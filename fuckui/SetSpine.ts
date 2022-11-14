
import { _decorator, sp } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetSpine
 * DateTime = Mon Jan 17 2022 14:32:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpine.ts
 * FileBasenameNoExtension = SetSpine
 * URL = db://assets/Script/NoUi3/fuckui/SetSpine.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetSpine')
@menu('NoUi/ui/SetSpine(设置spine动画:{path, animation, loop, timeScale})')
@requireComponent(sp.Skeleton)
export class SetSpine extends FuckUi {

    @property
    autoPlayOnEnable: boolean = false;
    @property({ visible() { return this.autoPlayOnEnable; } })
    animationName: string = '';
    @property({ type: no.EventHandlerInfo, displayName: '动画播放结束回调' })
    endCall: no.EventHandlerInfo = new no.EventHandlerInfo();


    onEnable() {
        if (this.autoPlayOnEnable) {
            let spine = this.getComponent(sp.Skeleton);
            spine.setAnimation(0, this.animationName, spine.loop);
            this.bindEndCall(spine);
        }
    }

    onDestroy() {
        this.getComponent(sp.Skeleton)?.skeletonData?.decRef();
    }

    protected onDataChange(data: any) {
        let { path, animation, loop, timeScale }: { path: string, animation: string, loop: boolean, timeScale: number } = data;
        let spine = this.getComponent(sp.Skeleton);
        if (path) {
            spine.enabled = true;
            no.assetBundleManager.loadSpine(path, res => {
                spine.skeletonData = res;
                spine.setAnimation(0, animation, loop);
                spine.timeScale = timeScale || 1;
            });
        } else if (animation) {
            spine.enabled = true;
            spine.setAnimation(0, animation, loop);
            spine.timeScale = timeScale || 1;
        } else {
            spine.clearTrack(0);
            spine.enabled = false;
        }
        if (loop === false)
            this.bindEndCall(spine);
    }

    public a_playOnce(animation: string) {
        let spine = this.getComponent(sp.Skeleton);
        spine.enabled = true;
        spine?.setAnimation(0, animation, false);
        this.bindEndCall(spine);
    }

    public a_playLoop(animation: string) {
        let spine = this.getComponent(sp.Skeleton);
        spine.enabled = true;
        spine?.setAnimation(0, animation, true);
    }

    public a_stop(): void {
        let spine = this.getComponent(sp.Skeleton);
        spine.clearTrack(0);
        spine.enabled = false;
    }


    public a_setEmpty(): void {
        this.a_stop();
    }

    private bindEndCall(spine: sp.Skeleton) {
        if (spine.loop) return;
        spine?.setCompleteListener(() => {
            this.endCall.execute();
            spine.setCompleteListener(() => { });
        });
    }
}
