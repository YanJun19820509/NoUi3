
import { ccclass, property, menu, Component, Node } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJEventOn
 * DateTime = Wed Jan 12 2022 23:54:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJEventOn.ts
 * FileBasenameNoExtension = YJEventOn
 * URL = db://assets/Script/NoUi3/base/event/YJEventOn.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('ListenerInfo')
export class ListenerInfo {
    @property({ displayName: '消息类型(不可重名)' })
    type: string = '';
    @property({ displayName: '仅监听一次' })
    once: boolean = false;
    @property(no.EventHandlerInfo)
    calls: no.EventHandlerInfo[] = [];
}

@ccclass('YJEventOn')
@menu('NoUi/event/YJEventOn(消息监听)')
export class YJEventOn extends Component {
    /** 事件监听信息列表 */
    @property(ListenerInfo)
    infos: ListenerInfo[] = [];

    /** 组件启用时初始化事件监听 */
    onEnable() {
        this.init();
    }

    /** 组件禁用时移除所有事件监听 */
    onDisable() {
        no.evn.targetOff(this);
    }

    /**
     * 手动触发指定类型的事件
     * @param e 事件参数或事件类型
     * @param type 事件类型,如果提供则优先使用type而不是e
     */
    public a_trigger(e: any, type?: string) {
        this._on(type || e);
    }

    /**
     * 初始化所有事件监听
     * 根据ListenerInfo中的配置为每个事件类型注册监听
     */
    private init() {
        for (let i = 0; i < this.infos.length; i++) {
            let info = this.infos[i];
            if (info.type == '') continue;
            if (info.once) {
                no.evn.once(info.type, this._on, this);
            } else {
                no.evn.on(info.type, this._on, this);
            }
        }
    }

    /**
     * 事件监听回调函数
     * @param args 事件参数列表,最后一个参数为事件类型
     */
    private _on(...args: string[]) {
        if (!this.infos) {
            this.onDisable();
            return;
        }
        let type = args.pop();
        no.log('YJEventOn', type, args);
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let info = this.infos[i];
            if (info.type == type) {
                no.EventHandlerInfo.execute(info.calls, type, args);
            }
        }
    }
}
