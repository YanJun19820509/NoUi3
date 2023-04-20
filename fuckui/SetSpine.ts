
import { _decorator, sp, assetManager } from 'cc';
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
@menu('NoUi/ui/SetSpine(设置spine动画:{path, skin, animation, loop, timeScale})')
// @requireComponent(sp.Skeleton)
export class SetSpine extends FuckUi {

    @property
    autoPlayOnEnable: boolean = false;
    @property({ visible() { return this.autoPlayOnEnable; } })
    animationName: string = '';
    @property({ type: no.EventHandlerInfo, displayName: '动画播放结束回调' })
    endCall: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property({ tooltip: '当两个动作切换出现异常时，可尝试勾选' })
    needClearTracks: boolean = true;

    private needRelease: boolean = false;
    curPath: string;

    onEnable() {
        if (this.autoPlayOnEnable) {
            let spine = this.getComponent(sp.Skeleton);
            if (spine.loop) this.a_playLoop(null, this.animationName);
            else this.a_playOnce(null, this.animationName);
        }
    }

    onDisable() {
        const spine = this.getComponent(sp.Skeleton);
        if (no.checkValid(spine)) {
            spine.clearTracks();
            this.needRelease && no.assetBundleManager.decRef(spine.skeletonData);
        }
    }

    protected onDataChange(data: any) {
        let { path, skin, animation, loop, timeScale }: { path: string, skin: string, animation: string, loop: boolean, timeScale: number } = data;
        const spine = this.getComponent(sp.Skeleton);

        /**
         * 如果传入路径和之前的资源路径不一致   释放之前的
         */
        if (path && this.curPath && this.curPath != path) {
            no.assetBundleManager.decRef(spine?.skeletonData);
        }

        if (path && this.curPath != path) {
            no.assetBundleManager.loadSpine(path, res => {
                if (!spine?.isValid) {
                    no.assetBundleManager.decRef(res);
                    return;
                }
                this.needRelease = true;
                this.curPath = path;

                spine.skeletonData = res;

                spine.timeScale = timeScale || 1;
                let tempStr = (skin ? (skin + ':') : '') + animation;
                if (loop) this.a_playLoop(tempStr);
                else this.a_playOnce(tempStr);
            });
        } else if (animation != null) {
            spine.timeScale = timeScale || 1;
            let tempStr = (skin ? (skin + ':') : '') + animation;
            if (loop) this.a_playLoop(tempStr);
            else this.a_playOnce(tempStr);
        } else {
            spine.clearTracks();
            spine.enabled = false;
        }
        if (loop === false)
            this.bindEndCall(spine);
    }

    public a_playOnce(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(sp.Skeleton);
        if (spine.enabled)
            this.needClearTracks && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
        spine?.setAnimation(0, name, false);
        this.bindEndCall(spine);
    }

    public a_playLoop(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(sp.Skeleton);
        if (spine.enabled)
            this.needClearTracks && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = true;
        !!skin && spine.setSkin(skin);
        spine?.setAnimation(0, name, true);
    }

    public a_stop(): void {
        const spine = this.getComponent(sp.Skeleton);
        spine.clearTrack(0);
        spine.enabled = false;
    }


    public a_setEmpty(): void {
        this.a_stop();
    }

    private bindEndCall(spine: sp.Skeleton) {
        spine?.setCompleteListener(() => {
            this?.endCall?.execute();
            spine?.setCompleteListener(() => { });
        });
    }
}
