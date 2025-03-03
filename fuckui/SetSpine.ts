
import { ccclass, property, menu, executeInEditMode, EDITOR, Skeleton, requireComponent, sys, size } from '../yj';
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
    private isFullScreenHide: boolean = false;
    private spineQueue: any[];
    private queueIndex: number = 0;
    private GlobalScale: number = 1;
    private defaultScale: number = 1;
    private loopNum: number = 0;
    private _startIndexes: string[];
    private _endIndexes: string[];
    private _curSpine: Skeleton;

    protected update(): void {
        if (!EDITOR) return;
        const spine = this.getComponent(Skeleton);
        if (spine.skeletonData && !spine.sockets.length && !this.spineUrl) {
            no.EditorMode.getAssetUrlByUuid(spine.skeletonData.uuid).then(url => {
                if (!url) return;
                this.spineUrl = url.replace('db://assets/', '').replace('.json', '');
                this.animationName = spine.animation;
                spine.skeletonData = null;
            });
        }
    }

    //性能判断
    // private checkFPS(dt: number) {
    //     if (SetSpine.disableSpineWhenLowFPS) {
    //         const fps = 1 / dt;
    //         if (fps < 45 && this.canSetSpine) {
    //             this.canSetSpine = false;
    //             this.getComponent(Skeleton).enabled = false;
    //         } else if (fps > 55 && !this.canSetSpine) {
    //             this.canSetSpine = true;
    //         }
    //     }
    // }

    onEnable() {
        if (sys.platform == sys.Platform.WECHAT_GAME)
            this.GlobalScale = .5;
        let spine = this.getComponent(Skeleton);
        spine.enabled = false;
        if (this.autoPlayOnEnable) {
            this.onDataChange({ path: this.curPath, animation: this.animationName, loop: spine.loop });
        }
    }

    onDisable() {
        if (!this.canDisable) return;
        this.a_clearData();
        let spine = this._curSpine;
        if (!spine) return;
        this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        spine.node?.destroy();
    }

    onDestroy() {
        YJSpineManager.ins.set(this.curPath);
    }

    protected onDataChange(data: any) {
        if (sys.platform == sys.Platform.WECHAT_GAME && this.GlobalScale != .5)
            this.GlobalScale = .5;
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
        let spine = this._curSpine;
        if (!path && !animation) {
            if (!spine) return;
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
            spine.node?.destroy();
            return;
        }

        if (!path && !this.curPath && this.spineUrl) {
            path = this.spineUrl;
        }

        /**
         * 如果传入路径和之前的资源路径不一致   释放之前的
         */
        if (path && this.curPath && this.curPath != path) {
            YJSpineManager.ins.set(this.curPath);
        }


        if (!spine?.isValid || (path && this.curPath != path)) {
            if (!path) path = this.curPath;
            YJSpineManager.ins.get(path).then(res => {
                if (!res) {
                    no.err(`spine资源${path}不存在`);
                    return;
                }
                if (!this.node?.isValid) {
                    YJSpineManager.ins.set(path);
                    return;
                }
                this.curPath = path;
                //销毁原spine节点  因为是异步的 所以需要重新获取
                let spine = this._curSpine;
                spine?.node?.destroy();
                //创建新spine节点
                const newSpineNode = no.newNode('spine', [Skeleton]);
                newSpineNode.parent = this.node;
                spine = newSpineNode.getComponent(Skeleton);
                this._curSpine = spine;
                const bSpine = this.getComponent(Skeleton);
                this.defaultScale = bSpine.timeScale;
                spine.premultipliedAlpha = bSpine.premultipliedAlpha;
                spine.defaultCacheMode = bSpine.defaultCacheMode;
                spine.enableBatch = bSpine.enableBatch;
                spine.sockets = bSpine.sockets;
                spine.skeletonData = res;
                spine.timeScale = ((timeScale || bSpine.timeScale) * this.GlobalScale);
                const width = res.getRuntimeData().width,
                    height = res.getRuntimeData().height;
                if (width > 0 && height > 0) {
                    no.size(this.node, size(width, height));
                }

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
            if (!spine) return;
            spine.node.active = true;
            spine.timeScale = ((timeScale || this.defaultScale) * this.GlobalScale);
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
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
            spine.enabled = false;
        }
    }

    private playLoopNum(animation: string) {
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this._curSpine;
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
        this.bindStartCall(spine);
        this.loopNum--;
        if (this.loopNum == 0)
            this.bindEndCall(spine);
        else
            this.bindLoop1EndCall(spine);
        this._play(spine, name, false);
    }

    private playDuration(duration: number) {
        if (!duration) return;
        this.scheduleOnce(() => {
            const spine = this._curSpine;
            spine.clearTrack(0);
            spine.loop = false;
            this?.endCall.execute(spine);
            this.setSpineData();
        }, duration);
    }

    public a_playOnce(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this._curSpine;
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
        this.bindStartCall(spine);
        this.bindEndCall(spine);
        this._play(spine, name, false);
    }

    public a_playLoop(e: any, animation?: string) {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this._curSpine;
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = true;
        !!skin && spine.setSkin(skin);
        this._play(spine, name, true);
    }

    private _play(spine: Skeleton, animationName: string, loop: boolean) {
        if (!no.spineEnable()) return;

        if (!spine.isAnimationCached() && !spine.skeletonData) {
            no.warn(`spine节点${spine.node.name}没有动画数据  this.curPath ${this.curPath}`);
            return
        }

        if (!spine?.node?.activeInHierarchy) {
            no.warn(`spine节点${spine.node.name}未在场景中激活  this.curPath ${this.curPath}`);
            return
        }
        if (!spine?.node?.active) {
            no.warn(`spine节点${spine.node.name}自身未激活  this.curPath ${this.curPath}`);
            return
        }
        spine?.setAnimation(0, animationName, loop);
    }

    public a_stop(): void {
        const spine = this._curSpine;
        spine?.clearTrack(0);
        spine?.node?.destroy();
    }

    public a_pause(e: any, animation?: string): void {
        animation = animation || e;
        if (!animation) return;
        const a = animation.split(':');
        const skin = a.length == 2 ? a[0] : null, name = a[a.length - 1];
        if (name == null) return;
        const spine = this._curSpine;
        if (spine.enabled)
            this.needClearTracks && !spine.isAnimationCached() && spine.clearTracks();
        else spine.enabled = true;
        spine.loop = false;
        !!skin && spine.setSkin(skin);
    }


    public a_setEmpty(): void {
        this.a_stop();
    }

    private bindStartCall(spine: Skeleton) {
        if (no.spineEnable()) {
            spine?.setStartListener(() => {
                if (!this._startIndexes || this._startIndexes.includes(String(this.queueIndex)))
                    this?.startCall.execute(spine);
                spine?.setStartListener(() => { });
            });
        } else {
            if (!this._startIndexes || this._startIndexes.includes(String(this.queueIndex)))
                this?.startCall.execute(spine);
        }
    }

    private bindEndCall(spine: Skeleton) {
        if (no.spineEnable()) {
            spine?.setCompleteListener(() => {
                if (!this._endIndexes || this._endIndexes.includes(String(this.queueIndex)))
                    this?.endCall.execute(spine);
                spine?.setCompleteListener(() => { });
                this.setSpineData();
            });
        } else {
            this.scheduleOnce(() => {
                if (!this._endIndexes || this._endIndexes.includes(String(this.queueIndex)))
                    this?.endCall.execute(spine);
                this.setSpineData();
            }, 1);
        }
    }

    private bindLoop1EndCall(spine: Skeleton) {
        if (no.spineEnable()) {
            spine?.setCompleteListener(() => {
                spine?.setCompleteListener(() => { });
                this.playLoopNum(spine.animation);
            });
        } else {
            this.scheduleOnce(() => {
                this.playLoopNum(spine.animation);
            }, 1);
        }
    }

    //todo 对循环播放的动画考虑按需暂停

    public setSpineEnable(v: boolean) {
        if (!this.canDisable) return;
        const spine = this._curSpine;
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
