
import { _decorator, Node, Tween } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetNodeTweenAction
 * DateTime = Mon Jan 17 2022 09:21:41 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetNodeTweenAction.ts
 * FileBasenameNoExtension = SetNodeTweenAction
 * URL = db://assets/Script/NoUi3/fuckui/SetNodeTweenAction.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetNodeTweenAction')
@menu('NoUi/ui/SetNodeTweenAction(设置节点缓动效果:object|[object])')
export class SetNodeTweenAction extends FuckUi {
    @property({ type: no.EventHandlerInfo, displayName: '缓动开始前回调' })
    beforeCall: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '缓动完成回调' })
    endCall: no.EventHandlerInfo[] = [];

    private _action: no.TweenSet | no.TweenSet[];

    protected onDataChange(data: any) {
        this.stop();
        if (Object.keys(data).length == 0) return;
        no.EventHandlerInfo.execute(this.beforeCall);
        this._action = this.createAction(data);
        this.run();
    }

    protected createAction(data: any): no.TweenSet | no.TweenSet[] {
        return no.parseTweenData(data, this.node);
    }

    private run() {
        no.TweenSet.play(this._action, () => {
            no.EventHandlerInfo.execute(this.endCall);
        });
        // if (this._action instanceof Array) {
        //     this._action.forEach((a, i) => {
        //         if (i == 0)
        //             a.start().then(() => {
        //                 no.EventHandlerInfo.execute(this.endCall);
        //             });
        //         else a.start();
        //     })
        // } else
        //     this._action?.start().then(() => {
        //         no.EventHandlerInfo.execute(this.endCall);
        //     });
    }

    private stop() {
        if (this._action instanceof Array) {
            this._action.forEach(a => {
                a.stop();
            })
        } else
            this._action?.stop();
        this._action = null;
    }
}
