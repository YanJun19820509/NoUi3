
import { _decorator, sp } from './yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { EDITOR } from 'cc/env';
import { YJSpineManager } from '../base/YJSpineManager';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

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
@executeInEditMode()
@requireComponent(sp.Skeleton)
export class SetSpine extends FuckUi {

    @property
    autoPlayOnEnable: boolean = false;
    @property
    spineUrl: string = '';
    @property({ visible() { return this.autoPlayOnEnable; } })
    animationName: string = '';
    @property({ type: no.EventHandlerInfo, displayName: '动画播放结束回调' })
    endCall: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property({ tooltip: '当两个动作切换出现异常时，可尝试勾选' })
    needClearTracks: boolean = true;
    @property({ tooltip: '当显示全屏界面时，是否支持disable' })
    canDisable: boolean = true;

    /**当帧率较低时禁止播放spine */
    public static disableSpineWhenLowFPS: boolean = false;

    curPath: string;
    private canSetSpine: boolean = true;
    private isFullScreenHide: boolean = false;

    protected update(): void {
        if (!EDITOR) return;
        const spine = this.getComponent(sp.Skeleton);
        if (spine.skeletonData && !spine.sockets.length && !this.spineUrl) {
            no.getAssetUrlInEditorMode(spine.skeletonData._uuid, url => {
                if (!url) return;
                this.spineUrl = url.replace('db://assets/', '').replace('.json', '');
                this.animationName = spine.animation;
                spine.skeletonData = null;
            });
        }
    }

    //性能判断
    private checkFPS(dt: number) {
        if (SetSpine.disableSpineWhenLowFPS) {
            const fps = 1 / dt;
            if (fps < 45 && this.canSetSpine) {
                this.canSetSpine = false;
                this.getComponent(sp.Skeleton).enabled = false;
            } else if (fps > 55 && !this.canSetSpine) {
                this.canSetSpine = true;
            }
        }
    }

    onEnable() {
        if (this.autoPlayOnEnable) {
            let spine = this.getComponent(sp.Skeleton);
            this.onDataChange({ animation: this.animationName, loop: spine.loop });
        }
    }

    onDisable() {
        this.a_clearData();
        let spine = this.getComponent(sp.Skeleton);
        spine?.clearTracks();
    }

    onDestroy() {
        YJSpineManager.ins.set(this.curPath);
    }

    protected onDataChange(data: any) {
        if (!this.canSetSpine) return;
        let { path, skin, animation, loop, timeScale }: { path: string, skin: string, animation: string, loop: boolean, timeScale: number; } = data;
        const spine = this.getComponent(sp.Skeleton);

        if (!path && !this.curPath && !spine.skeletonData && this.spineUrl) {
            path = this.spineUrl;
        }

        /**
         * 如果传入路径和之前的资源路径不一致   释放之前的
         */
        if (path && this.curPath && this.curPath != path) {
            no.assetBundleManager.decRef(spine?.skeletonData);
        }

        if (timeScale)
            spine.timeScale = timeScale;

        if (path && this.curPath != path) {
            YJSpineManager.ins.get(path).then(res => {
                if (!spine?.isValid) {
                    no.assetBundleManager.decRef(res);
                    return;
                }
                this.curPath = path;
                //在设置新SkeletonData 之前清理下RenderData
                spine.destroyRenderData();
                spine.skeletonData = res;

                let tempStr = (skin ? (skin + ':') : '') + animation;
                if (loop) this.a_playLoop(tempStr);
                else this.a_playOnce(tempStr);
            });
        } else if (animation != null) {
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

    //todo 对循环播放的动画考虑按需暂停

    public setSpineEnable(v: boolean) {
        if (!this.canSetSpine) return;
        if (!this.canDisable) return;
        const spine = this.getComponent(sp.Skeleton);
        if (!spine.node.activeInHierarchy) return;
        if (v && !this.isFullScreenHide) {
            return;
        }
        if (!v && !spine.enabled) {
            this.isFullScreenHide = false;
            return;
        }
        if (v) {
            spine.enabled = true;
            this.isFullScreenHide = false;
        } else {
            this.isFullScreenHide = true;
            spine.enabled = false;
        }
    }
}
