
import { _decorator, Component, game, sys, Game } from 'cc';
import { JSB } from 'cc/env';
import { no } from '../no';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJGameState
 * DateTime = Fri Jan 14 2022 17:56:31 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGameState.ts
 * FileBasenameNoExtension = YJGameState
 * URL = db://assets/Script/NoUi3/base/YJGameState.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJGameState')
@menu('NoUi/base/YJGameState(游戏状态)')
export class YJGameState extends Component {
    @property({ type: no.EventHandlerInfo, displayName: '进入后台时回调' })
    onHideCalls: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '回到前台时回调' })
    onShowCalls: no.EventHandlerInfo[] = [];

    @property({ type: no.EventHandlerInfo, displayName: '内存不足时回调' })
    onLowMemoryCalls: no.EventHandlerInfo[] = [];

    @property({ displayName: '进入后台多长时间执行回到前台回调(秒)' })
    duration: number = 30;

    @property({ displayName: '触发游戏重启的事件类型' })
    type: string = 'game_restart'

    private time: number;

    onLoad() {
        game.on(Game.EVENT_HIDE, this.onHide, this);
        game.on(Game.EVENT_SHOW, this.onShow, this);
        game.on(Game.EVENT_LOW_MEMORY, this.onLowMemory, this);
        no.evn.on(this.type, this.a_restart, this);
    }

    onDestroy() {
        game.targetOff(this);
    }

    private onHide(): void {
        this.time = no.timestamp();
        no.EventHandlerInfo.execute(this.onHideCalls);
    }

    private onShow(): void {
        if (no.timestamp() - this.time >= this.duration)
            no.EventHandlerInfo.execute(this.onShowCalls);
    }

    private onLowMemory() {
        no.EventHandlerInfo.execute(this.onLowMemoryCalls);
    }

    public a_restart() {
        if (JSB)
            this.scheduleOnce(() => {
                //重启一定要有足够的延时才不会异常
                game.restart();
            }, 1);
        else if (sys.isBrowser)
            window.document.location.reload();
    }
}
