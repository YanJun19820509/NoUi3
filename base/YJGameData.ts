import { ccclass } from '../../NoUi3/yj';
import { no } from '../no';

/**
 * 游戏数据基类
 * Author mqsy_yj
 * DateTime Tue Jul 11 2023 16:40:10 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJGameData')
export class YJGameData extends no.Data {
    private static _ins: any;
    private _state: no.State;

    public static instance(): any {
        if (!this._ins) {
            this._ins = new this();
            this._ins._state = new no.State();
        }
        return this._ins;
    }

    public checkStateChange(target: any): boolean {
        return this._state.check('data_change', target).state;
    }

    public set(path: string, value: any, recursive = true) {
        super.set(path, value, recursive);
        this._state.set('data_change');
    }
}
