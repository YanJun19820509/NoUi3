
import { _decorator, Component, Node, Tween, tween } from 'cc';
import { SetNodeTweenAction } from '../SetNodeTweenAction';
import { no } from '../../no';
const { ccclass, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetBlink
 * DateTime = Mon Jan 17 2022 09:55:37 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetBlink.ts
 * FileBasenameNoExtension = SetBlink
 * URL = db://assets/Script/NoUi3/tween/SetBlink.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetBlink')
@menu('NoUi/tween/SetBlink(闪烁动效:object)')
export class SetBlink extends SetNodeTweenAction {
    protected createAction(data: any): no.TweenSet | no.TweenSet[] {
        let d = [{
            duration: 1 / data.frequency,
            to: 1,
            props: {
                opacity: 0
            }
        }, {
            duration: 1 / data.frequency,
            to: 1,
            props: {
                opacity: 255
            }
        }, {
            repeat: data.repeat
        }];
        return no.parseTweenData(d, this.node);
    }
}
