import { ccclass } from '../../NoUi3/yj';
import { FuckUi } from './FuckUi';

/**
 * 
 * Author mqsy_yj
 * DateTime Wed Mar 20 2024 10:10:23 GMT+0800 (中国标准时间)
 * 给YJEventOn中监听事件动态设置value
 */

@ccclass('SetEventValue')
export class SetEventValue extends FuckUi {

    protected onDataChange(data: any) {
        this.getComponent('YJEventOn')?.['setEventValue'](data);
    }
}
