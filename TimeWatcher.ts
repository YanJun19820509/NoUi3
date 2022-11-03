
import { sys, _decorator } from 'cc';
import { no } from './no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = TimeWatcher
 * DateTime = Wed Aug 17 2022 14:07:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = TimeWatcher.ts
 * FileBasenameNoExtension = TimeWatcher
 * URL = db://assets/NoUi3/TimeWatcher.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**debug用时间日志 */
@ccclass('TimeWatcher')
export class TimeWatcher {

    private static t: number = 0;

    public static blink(Evn?: string): void {
        let t = sys.now();
        no.err('TimeWatcher', Evn || 'blink', t, t - this.t);
        this.t = t;
    }
}