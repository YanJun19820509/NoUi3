
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

    private _action: Tween<Node>;

    protected onDataChange(data: any) {
        this.stop();
        no.EventHandlerInfo.execute(this.beforeCall);
        this._action = this.createAction(data)?.call(() => {
            no.EventHandlerInfo.execute(this.endCall);
        }).start();
    }

    protected createAction(data: any): Tween<Node> {
        return no.parseTweenData(data, this.node);
    }

    private stop() {
        this._action?.stop();
        this._action = null;
    }
}
