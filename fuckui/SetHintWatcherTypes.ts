import { ccclass } from '../../NoUi3/yj';
import { YJHintWatcher } from '../base/YJHintWatcher';
import { FuckUi } from './FuckUi';

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Feb 01 2024 11:18:11 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetHintWatcherTypes')
export class SetHintWatcherTypes extends FuckUi {

    protected onDataChange(data: any) {
        this.getComponent(YJHintWatcher).setHintTypes(data);
    }
}
