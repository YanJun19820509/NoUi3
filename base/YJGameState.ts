
import { JSB, ccclass, property, menu, Component, game, sys, Game } from '../yj';
import { no } from '../no';
import { YJWindowManager } from './node/YJWindowManager';

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
@ccclass('YJGameState')
@menu('NoUi/base/YJGameState(游戏状态)')
/**
 * 游戏状态管理组件
 * @description 处理游戏生命周期事件（后台/前台切换、内存警告）、游戏重启/退出逻辑
 * @example 
 * // 编辑器配置示例：
 * // - 添加组件到场景常驻节点
 * // - 配置各事件回调（如后台时暂停游戏音效）
 * 
 * @example
 * // 代码调用示例：
 * // 触发游戏重启
 * no.evn.emit('game_state_event_restart');
 * // 或通过节点组件调用
 * this.getComponent(YJGameState).a_restartGame();
 */
export class YJGameState extends Component {
    /** 游戏进入后台时执行的回调列表（编辑器配置） */
    @property({ type: no.EventHandlerInfo, displayName: '进入后台时回调' })
    onHideCalls: no.EventHandlerInfo[] = [];

    /** 游戏回到前台时执行的回调列表（编辑器配置） */
    @property({ type: no.EventHandlerInfo, displayName: '回到前台时回调' })
    onShowCalls: no.EventHandlerInfo[] = [];

    /** 收到内存不足警告时执行的回调列表（编辑器配置） */
    @property({ type: no.EventHandlerInfo, displayName: '内存不足时回调' })
    onLowMemoryCalls: no.EventHandlerInfo[] = [];

    /** 游戏退出事件名称（通过事件系统触发） */
    @property({ displayName: '游戏退出的事件', readonly: true })
    event_end: string = 'game_state_event_end';

    /** 游戏重启事件名称（通过事件系统触发） */
    @property({ displayName: '游戏重启的事件', readonly: true })
    event_restart: string = 'game_state_event_restart';

    /** 是否使用引擎原生重启方式（否则执行自定义回调） */
    @property({ displayName: '引擎重启' })
    isEngineRestart: boolean = false;

    /** 游戏重启时执行的自定义回调列表（当不使用引擎重启时生效） */
    @property({ type: no.EventHandlerInfo, displayName: '游戏重启时回调', visible() { return !this.isEngineRestart; } })
    onGameRestart: no.EventHandlerInfo[] = [];

    /**
     * 组件加载时初始化事件监听
     * @description 注册游戏生命周期事件和自定义重启/退出事件
     */
    onLoad() {
        game.on(Game.EVENT_HIDE, this.onHide, this);
        game.on(Game.EVENT_SHOW, this.onShow, this);
        game.on(Game.EVENT_LOW_MEMORY, this.onLowMemory, this);
        no.evn.on(this.event_end, this.onEvent, this);
        no.evn.on(this.event_restart, this.onEvent, this);
        if (sys.platform == sys.Platform.WECHAT_GAME) {
            window['wx'].onMemoryWarning(() => {
                this.onLowMemory();
            });
        }
    }

    /** 组件销毁时移除事件监听 */
    onDestroy() {
        game.targetOff(this);
    }

    /** 处理游戏进入后台逻辑 */
    private onHide(): void {
        no.EventHandlerInfo.execute(this.onHideCalls);
        no.evn.emit('game_hide')
    }

    /** 处理游戏回到前台逻辑 */
    private onShow(): void {
        no.EventHandlerInfo.execute(this.onShowCalls);
        no.evn.emit('game_show')
    }

    /** 处理内存不足警告 */
    private onLowMemory() {
        no.warn('内存不足警告');
        YJWindowManager.clearClosedPanel();
        no.GC();
        no.EventHandlerInfo.execute(this.onLowMemoryCalls);
    }

    /**
     * 处理自定义事件
     * @param type 事件类型（event_end/event_restart）
     */
    private onEvent(type: string) {
        if (type == this.event_end) {
            if (JSB)
                game.end();
            else if (sys.isBrowser)
                window.document.location.reload();
        } else {
            if (this.isEngineRestart) {
                if (JSB)
                    game.restart();
                else if (sys.platform == sys.Platform.WECHAT_GAME)
                    window['wx'].restartMiniProgram();
                else if (sys.isBrowser)
                    window.document.location.reload();
            } else no.EventHandlerInfo.execute(this.onGameRestart);
        }
    }

    /** 公开的重新启动游戏方法（供动画事件等调用） */
    public a_restartGame() {
        this.onEvent(this.event_restart);
    }

    /** 公开的结束游戏方法（供动画事件等调用） */
    public a_endGame() {
        this.onEvent(this.event_end);
    }
}
