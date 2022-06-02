
import { _decorator, Component, Node } from 'cc';
import { no } from '../../no';
const { ccclass, property, menu } = _decorator;

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
    @property
    type: string = '';
    @property(no.EventHandlerInfo)
    calls: no.EventHandlerInfo[] = [];
}

@ccclass('YJEventOn')
@menu('NoUi/event/YJEventOn(消息监听)')
export class YJEventOn extends Component {
    @property(ListenerInfo)
    infos: ListenerInfo[] = [];

    @property({ displayName: '受节点active影响' })
    nodeActiveEffect: boolean = true;

    @property({ displayName: '仅监听一次' })
    once: boolean = false;

    onLoad() {
        if (!this.nodeActiveEffect) this.init();
    }

    onEnable() {
        if (this.nodeActiveEffect) this.init();
    }

    onDisable() {
        no.evn.targetOff(this);
    }

    public a_trigger(e: any, type?: string) {
        this._on(type || e);
    }

    private init() {
        this.infos.forEach(info => {
            if (info.type == '') return;
            if (this.once) {
                no.evn.once(info.type, this._on, this);
            } else {
                no.evn.on(info.type, this._on, this);
            }
        });
    }

    private _on(type: string, ...args: string[]) {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let info = this.infos[i];
            if (info.type == type) {
                no.EventHandlerInfo.execute(info.calls, type, args);
                break;
            }
        }
    }
}
