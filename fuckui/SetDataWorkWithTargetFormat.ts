
import { ccclass, property } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetDataWorkWithTargetFormat
 * DateTime = Tue Feb 28 2023 10:41:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetDataWorkWithTargetFormat.ts
 * FileBasenameNoExtension = SetDataWorkWithTargetFormat
 * URL = db://assets/NoUi3/fuckui/SetDataWorkWithTargetFormat.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('DataMapInfo')
export class DataMapInfo {
    @property
    targetDataKey: string = '';
    @property
    inputDataValueKey: string = '';
}

//将数据转换成目标DataWork所需要的格式
@ccclass('SetDataWorkWithTargetFormat')
export class SetDataWorkWithTargetFormat extends FuckUi {
    @property(YJDataWork)
    targetDataWork: YJDataWork = null;
    @property({ type: DataMapInfo, displayName: '数据映射' })
    dataMaps: DataMapInfo[] = [];

    protected onDataChange(data: any) {
        if (this.targetDataWork) {
            let a = {};
            this.dataMaps.forEach(map => {
                a[map.targetDataKey] = data[map.inputDataValueKey];
            });
            this.targetDataWork.data = a;
            this.targetDataWork.init();
        }
    }
}
