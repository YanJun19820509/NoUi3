import { _decorator, Component, Node } from 'cc';
import { no } from 'NoUi3/no';
import { YJDataWork } from './YJDataWork';
import { singleObject } from 'NoUi3/types';
const { ccclass, property } = _decorator;
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
                if (this.removeList.includes(this.list[i].uuid)) {
                    this.list.splice(i, 1);
                } else {
                    this.list[i].syncDataToUi();
                }
            }
            this.removeList.length = 0;
        } else {
            this.list.forEach(item => {
                item.syncDataToUi();
            });
        }
    }
}


