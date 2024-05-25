import { ccclass, property } from '../../NoUi3/yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * 触发执行
 * Author mqsy_yj
 * DateTime Wed May 22 2024 18:23:36 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetRunFunc')
export class SetRunFunc extends FuckUi {

    @property({ type: no.EventHandlerInfo })
    calls: no.EventHandlerInfo[] = [];

    protected onDataChange(data: any) {
        no.EventHandlerInfo.execute(this.calls, data);
    }
}
