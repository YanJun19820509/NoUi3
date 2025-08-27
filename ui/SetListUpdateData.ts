import { ccclass, requireComponent } from '../yj';
import { HackUi } from './HackUi';
import { SetList } from './SetList';

/**
 * 
 * Author mqsy_yj
 * DateTime Wed Aug 27 2025 15:11:32 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetListUpdateData')
@requireComponent(SetList)
export class SetListUpdateData extends HackUi {

    protected onDataChange(data: any) {
        this.getComponent(SetList).updateData(data);
    }
}
