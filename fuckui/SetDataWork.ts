
import { _decorator } from 'cc';
import { YJDataWork } from '../base/YJDataWork';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetDataWork
 * DateTime = Mon Jan 17 2022 10:45:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetDataWork.ts
 * FileBasenameNoExtension = SetDataWork
 * URL = db://assets/Script/NoUi3/fuckui/SetDataWork.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetDataWork')
@menu('NoUi/ui/SetDataWork(将数据赋值给YJDataWork:any)')
export class SetDataWork extends FuckUi {

    @property(YJDataWork)
    dataWork: YJDataWork = null;

    protected onDataChange(data: any) {
        if (this.dataWork) {
            this.dataWork.data = data;
            this.dataWork.init();
        }
    }
}
