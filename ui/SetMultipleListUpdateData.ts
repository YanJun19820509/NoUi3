import { ccclass, requireComponent } from '../../NoUi3/yj';
import { HackUi } from './HackUi';
import { SetMultipleList } from './SetMultipleList';

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Mar 21 2024 11:13:16 GMT+0800 (中国标准时间)
 * 仅用于当SetMultipleList数据内某条数据修改且不需要刷新整个列表时
 */

@ccclass('SetMultipleListUpdateData')
@requireComponent(SetMultipleList)
export class SetMultipleListUpdateData extends HackUi {


    protected onDataChange(data: any) {
        this.getComponent(SetMultipleList).updateData(data);
    }
}
