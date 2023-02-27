
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
@menu('NoUi/ui/SetSpine(设置spine动画:{path, skin, animation, loop, timeScale})')
@requireComponent(sp.Skeleton)
export class SetSpine extends FuckUi {

    @property
    autoPlayOnEnable: boolean = false;
    @property({ visible() { return this.autoPlayOnEnable; } })
    animationName: string = '';
    @property({ type: no.EventHandlerInfo, displayName: '动画播放结束回调' })
    endCall: no.EventHandlerInfo = new no.EventHandlerInfo();

    curPath: string;

    onEnable() {
        if (this.autoPlayOnEnable) {
            let spine = this.getComponent(sp.Skeleton);
            spine.setAnimation(0, this.animationName, spine.loop);
            this.bindEndCall(spine);
        }
    }

    onDestroy() {
        const spine = this.getComponent(sp.Skeleton);
        if (spine) {
            spine?.setCompleteListener(() => { });
            spine?.skeletonData?.decRef();
        }
    }

    protected onDataChange(data: any) {
        let { path, skin, animation, loop, timeScale }: { path: string, skin: string, animation: string, loop: boolean, timeScale: number } = data;
        const spine = this.getComponent(sp.Skeleton);

        /**
         * 如果传入路径和之前的资源路径不一致   释放之前的
         */
        if (path && this.curPath && this.curPath != path) {
            spine?.skeletonData?.decRef();
        }

        if (path && this.curPath != path && animation != null) {
            spine.enabled = true;
            no.assetBundleManager.loadSpine(path, res => {
                if (!spine) return;
                this.curPath = path;

                spine.skeletonData = res;
                !!skin && spine.setSkin(skin);
                spine.setAnimation(0, animation, loop || false);
                spine.timeScale = timeScale || 1;
            });
        } else if (animation != null) {
            spine.enabled = true;
            !!skin && spine.setSkin(skin);
            spine.setAnimation(0, animation, loop || false);
            spine.timeScale = timeScale || 1;
        } else {
            spine.clearTrack(0);
            spine.enabled = false;
        }
        if (loop === false)
            this.bindEndCall(spine);
    }

    public a_playOnce(animation: string) {
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(sp.Skeleton);
        spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
        spine?.setAnimation(0, name, false);
        this.bindEndCall(spine);
    }

    public a_playLoop(animation: string) {
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(sp.Skeleton);
        spine.enabled = true;
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
