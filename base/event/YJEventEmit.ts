
import { _decorator, Component, Node } from 'cc';
import { no } from '../../no';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = YJEventEmit
 * DateTime = Wed Jan 12 2022 23:54:05 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJEventEmit.ts
 * FileBasenameNoExtension = YJEventEmit
 * URL = db://assets/Script/NoUi3/base/event/YJEventEmit.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJEventEmit')
@menu('NoUi/event/YJEventEmit(消息发送:string(type:value))')
export class YJEventEmit extends Component {
    public a_emit(e: any, v?: string) {
        let args = (v || e).split(':');
        no.evn.emit.call(no.evn, args[0], args);
    }
}
