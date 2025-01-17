import { no } from 'NoUi3/no';
import { YJDataWork } from './YJDataWork';
import { singleObject } from 'NoUi3/types';
import { ccclass } from 'NoUi3/yj';
/**
 * dataWork管理器,延时处理dataWork数据同步逻辑
 */
@ccclass('YJDataWorkManager')
@singleObject()
export class YJDataWorkManager extends no.SingleObject {
    private list: YJDataWork[] = [];
    private removeList: string[] = [];

    public static ins(): YJDataWorkManager {
        return super.instance() as YJDataWorkManager;
    }

    public add(dataWork: YJDataWork) {
        this.list.push(dataWork);
    }

    public remove(dataWork: YJDataWork) {
        this.removeList.push(dataWork.uuid);
    }

    public clear(): void {
        this.list.length = 0;
        this.removeList.length = 0;
    }

    lastUpdate() {
        if (this.removeList.length > 0) {
            for (let i = this.list.length - 1; i >= 0; i--) {
                const item = this.list[i];
                if (this.removeList.indexOf(item.uuid) >= 0) {
                    this.list.splice(i, 1);
                } else {
                    item.syncDataToUi();
                }
            }
            this.removeList.length = 0;
        } else {
            for (let i = 0; i < this.list.length; i++) {
                this.list[i].syncDataToUi();
            }
        }
    }
}


