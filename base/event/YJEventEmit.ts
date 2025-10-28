
import { ccclass, menu, Component, EventTouch } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJEventEmit
 * DateTime = Wed Jan 12 2022 23:54:05 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJEventEmit.ts
 * FileBasenameNoExtension = YJEventEmit
 * URL = db://assets/Script/common/base/event/YJEventEmit.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJEventEmit')
@menu('NoUi/event/YJEventEmit(消息发送:string(type:value))')
/**
 * 事件发送组件,用于发送自定义事件
 */
export class YJEventEmit extends Component {
    /**
     * 发送事件
     * @param e 事件参数,格式为"事件类型:事件值"的字符串
     * @param v 可选的事件参数,如果提供则优先使用v而不是e
     * 
     * 示例:
     * - a_emit("click:button1") 发送click事件,参数为["click", "button1"]
     * - a_emit(event, "open:panel1") 发送open事件,参数为["open", "panel1"]
     */
    public a_emit(e: any, v?: string) {
        let args: string[];
        if (v) {
            args = v.split(':');
            if (!(e instanceof EventTouch)) {
                args.push(e);
            }
        } else {
            args = e.split(':');
        }

        no.evn.emit(args.shift(), ...args);
    }
}
