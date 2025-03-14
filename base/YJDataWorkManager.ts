import { no } from 'NoUi3/no';
import { YJDataWork } from './YJDataWork';
import { singleObject } from 'NoUi3/types';
import { ccclass } from 'NoUi3/yj';
/**
 * dataWork管理器,延时处理dataWork数据同步逻辑
 */
@ccclass('YJDataWorkManager')
@singleObject()
/**
 * 数据工作管理器
 * @class 管理所有数据工作实例，延迟处理数据到UI的同步逻辑
 * @example
 * // 获取管理器单例
 * const manager = YJDataWorkManager.ins();
 * 
 * // 注册数据工作组件
 * manager.add(dataWorkComponent);
 */
export class YJDataWorkManager extends no.SingleObject {
    // 存储所有需要同步的数据工作实例
    private list: YJDataWork[] = [];
    // 待移除的实例UUID列表
    private removeList: string[] = [];

    /**
     * 获取单例实例
     * @returns 管理器单例对象
     * @example
     * // 在任意地方获取管理器
     * const manager = YJDataWorkManager.ins();
     */
    public static ins(): YJDataWorkManager {
        return super.instance() as YJDataWorkManager;
    }

    /**
     * 注册数据工作实例
     * @param dataWork 需要管理的数据工作组件
     * @example
     * // 在数据工作组件的初始化阶段注册
     * YJDataWorkManager.ins().add(this);
     */
    public add(dataWork: YJDataWork) {
        this.list.push(dataWork);
    }

    /**
     * 标记移除数据工作实例
     * @param dataWork 需要移除的数据工作组件
     * @example
     * // 在组件销毁时解除注册
     * YJDataWorkManager.ins().remove(this);
     */
    public remove(dataWork: YJDataWork) {
        this.removeList.push(dataWork.uuid);
    }

    /**
     * 清空所有管理实例
     * @example
     * // 场景切换时清空所有数据绑定
     * YJDataWorkManager.ins().clear();
     */
    public clear(): void {
        this.list.length = 0;
        this.removeList.length = 0;
    }

    /**
     * 执行数据同步更新（通常在lateUpdate阶段调用）
     * @remarks 处理逻辑：
     * 1. 先处理需要移除的实例
     * 2. 逆序遍历避免数组塌陷
     * 3. 执行剩余实例的UI同步
     * @example
     * // 在游戏主循环中调用
     * manager.lastUpdate();
     */
    lastUpdate() {
        if (this.removeList.length > 0) {
            // 逆序遍历避免删除导致的数组索引错乱
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
            // 常规遍历执行同步
            for (let i = 0; i < this.list.length; i++) {
                this.list[i].syncDataToUi();
            }
        }
    }
}


