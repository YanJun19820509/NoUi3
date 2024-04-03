
import { ccclass, property, menu, executeInEditMode, EDITOR, Skeleton, requireComponent, sys } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { YJSpineManager } from '../base/YJSpineManager';

/**
 * Predefined variables
 * Name = SetSpine
 * DateTime = Mon Jan 17 2022 14:32:44 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpine.ts
 * FileBasenameNoExtension = SetSpine
 * URL = db://assets/Script/NoUi3/fuckui/SetSpine.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * data:{path, skin, animation, loop, timeScale, loopNum}|[{path, skin, animation, loop, timeScale},...]
 * 支持动画链
 */

@ccclass('SetSpine')
@menu('NoUi/ui/SetSpine(设置spine动画)')
@executeInEditMode()
@requireComponent(Skeleton)
export class SetSpine extends FuckUi {

    @property
    autoPlayOnEnable: boolean = false;
    @property
    spineUrl: string = '';
    @property({ visible() { return this.autoPlayOnEnable; } })
    animationName: string = '';
    @property({ displayName: '支持开始回调的下标', tooltip: '当有动画播放队列时，可指定队列中某些下标的动画在开始播放时执行回调，多个下标用逗号分隔' })
    startIndexes: string = '';
    @property({ type: no.EventHandlerInfo, displayName: '动画播放开始回调' })
    startCall: no.EventHandlerInfo = new no.EventHandlerInfo();
    @property({ displayName: '支持结束回调的下标', tooltip: '当有动画播放队列时，可指定队列中某些下标的动画在结束播放时执行回调，多个下标用逗号分隔' })
    endIndexes: string = '';
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
    private spineQueue: any[];
    private queueIndex: number = 0;
    private GlobalScale: number = 1;
    private loopNum: number = 0;
    private _startIndexes: string[];
    private _endIndexes: string[];

    protected update(): void {
        if (!EDITOR) return;
        const spine = this.getComponent(Skeleton);
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
                this.getComponent(Skeleton).enabled = false;
            } else if (fps > 55 && !this.canSetSpine) {
                this.canSetSpine = true;
            }
        }
    }

    onEnable() {
        if (sys.platform == sys.Platform.WECHAT_GAME)
            this.GlobalScale = .5;
        let spine = this.getComponent(Skeleton);
        if (this.autoPlayOnEnable) {
            this.onDataChange({ animation: this.animationName, loop: spine.loop });
        }
    }

    onDisable() {
        if (!this.canDisable) return;
        this.a_clearData();
        let spine = this.getComponent(Skeleton);
        spine?.clearTracks();
        spine?.destroyRenderData();
    }

    onDestroy() {
        YJSpineManager.ins.set(this.curPath);
    }

    protected onDataChange(data: any) {
        if (sys.platform == sys.Platform.WECHAT_GAME && this.GlobalScale != .5)
            this.GlobalScale = .5;
        if (!this.canSetSpine) return;
        if (this.startIndexes)
            this._startIndexes = this.startIndexes.split(',');
        if (this.endIndexes)
            this._endIndexes = this.endIndexes.split(',');
        this.spineQueue = [].concat(data);
        this.queueIndex = -1;
        this.setSpineData();
    }

    private setSpineData() {
        const data = this.spineQueue[++this.queueIndex];
        if (!data) return;
        let { path, skin, animation, loop, timeScale, loopNum, pause, duration }: { path: string, skin: string, animation: string, loop: boolean, timeScale: number, loopNum: number, pause: boolean, duration: number } = data;
        const spine = this.getComponent(Skeleton);

        if (!path && !animation) {
            spine.clearTracks();
            spine.enabled = false;
            return;
        }

        if (!path && !this.curPath && !spine.skeletonData && this.spineUrl) {
            path = this.spineUrl;
        }

        /**
         * 如果传入路径和之前的资源路径不一致   释放之前的
         */
        if (path && this.curPath && this.curPath != path) {
            YJSpineManager.ins.set(this.curPath);
        }

        spine.timeScale = ((timeScale || 1) * this.GlobalScale);

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
                if (pause) {
                    this.a_pause(tempStr);
                } else if (loop) this.a_playLoop(tempStr);
                else if (loopNum > 1) {
                    this.loopNum = loopNum;
                    this.playLoopNum(tempStr);
                } else this.a_playOnce(tempStr);
                this.playDuration(duration);
            });
        } else if (animation != null) {
            let tempStr = (skin ? (skin + ':') : '') + animation;
            if (pause) {
                this.a_pause(tempStr);
            }
            else if (loop) this.a_playLoop(tempStr);
            else if (loopNum > 1) {
                this.loopNum = loopNum;
                this.playLoopNum(tempStr);
            } else this.a_playOnce(tempStr);
            this.playDuration(duration);
        } else {
            spine.clearTracks();
            spine.enabled = false;
        }
    }

    private playLoopNum(animation: string) {
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(Skeleton);
        if (spine.enabled)
            this.needClearTracks && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
        this.bindStartCall(spine);
        this.loopNum--;
        if (this.loopNum == 0)
            this.bindEndCall(spine);
        else
            this.bindLoop1EndCall(spine);
        spine?.setAnimation(0, name, false);
    }

    private playDuration(duration: number) {
        if (!duration) return;
        this.scheduleOnce(() => {
            const spine = this.getComponent(Skeleton);
            spine.clearTrack(0);
            spine.loop = false;
            this?.endCall.execute(spine.animation);
            this.setSpineData();
        }, duration);
    }

    public a_playOnce(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(Skeleton);
        if (spine.enabled)
            this.needClearTracks && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
        this.bindStartCall(spine);
        this.bindEndCall(spine);
        spine?.setAnimation(0, name, false);
    }

    public a_playLoop(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(Skeleton);
        if (spine.enabled)
            this.needClearTracks && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = true;
        !!skin && spine.setSkin(skin);
        spine?.setAnimation(0, name, true);
    }

    public a_stop(): void {
        const spine = this.getComponent(Skeleton);
        spine.clearTrack(0);
        spine.enabled = false;
    }

    public a_pause(e: any, animation?: string): void {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this.getComponent(Skeleton);
        if (spine.enabled)
            this.needClearTracks && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
    }


    public a_setEmpty(): void {
        this.a_stop();
    }

    private bindStartCall(spine: Skeleton) {
        spine?.setStartListener(() => {
            if (!this._startIndexes || this._startIndexes.includes(String(this.queueIndex)))
                this?.startCall.execute(spine.animation);
            spine?.setStartListener(() => { });
        });
    }

    private bindEndCall(spine: Skeleton) {
        spine?.setCompleteListener(() => {
            if (!this._endIndexes || this._endIndexes.includes(String(this.queueIndex)))
                this?.endCall.execute(spine.animation);
            spine?.setCompleteListener(() => { });
            this.setSpineData();
        });
    }

    private bindLoop1EndCall(spine: Skeleton) {
        spine?.setCompleteListener(() => {
            spine?.setCompleteListener(() => { });
            this.playLoopNum(spine.animation);
        });
    }

    //todo 对循环播放的动画考虑按需暂停

    public setSpineEnable(v: boolean) {
        if (!this.canSetSpine) return;
        if (!this.canDisable) return;
        const spine = this.getComponent(Skeleton);
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
