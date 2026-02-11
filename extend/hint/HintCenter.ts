/**
 * 
 * Author mqsy_yj
 * DateTime Tue Feb 10 2026 09:16:00 GMT+0800 (中国标准时间)
 *
 */

import { no } from '../../no';
import { mathUtils } from '../mathUtils';
import { dateUtils } from '../dateUtils';
import { arrayUtils } from '../arrayUtils';

/** 
     * 红点管理类 
     * @example
     * // 初始化红点系统
     * hintCenter.onHint('mail', (count, type) => {
     *   this.updateMailRedDot(count);
     * }, this);
     * 
     * // 设置任务红点数量
     * hintCenter.setHint('dailyTask', 3);
     * 
     * // 设置带时间戳的红点（明天12点触发）
     * hintCenter.setHintTimestamp('activity', Date.now() + 86400000);
     */
class HintCenter extends no.Event {
    /** 存储红点类型与对应数值 */
    private data: Map<string, number> = new Map<string, number>();
    /** 子类型到主类型的映射表 */
    private sub2Main: { [subType: string]: string } = {};
    /** 主类型到子类型的映射表 */
    private main2Subs: { [mainType: string]: string[] } = {};
    /** 时间戳触发记录 */
    private timestampHit: object = new Object();

    constructor() {
        super();
        // 每2秒检查一次时间戳触发
        setInterval(() => {
            this.checkHint();
        }, 2000);
    }

    /**
     * 设置红点状态
     * @param type 红点类型标识
     * @param v 红点显示数量（0为隐藏）
     * @example
     * // 设置邮件红点数量
     * hintCenter.setHint('mail', 5);
     * 
     * // 清除成就红点
     * hintCenter.setHint('achievement', 0);
     */
    public setHint(type: string, v: number) {
        v = mathUtils.float(v, 0);
        this.data.set(type, v);
        this.checkHintType(type);
    }

    /**
     * 设置主红点状态（直接设置不检查子类型）
     * @param type 主红点类型
     * @param v 红点显示数量
     * @example
     * // 强制设置主界面红点
     * hintCenter.setMainHint('mainUI', 1);
     */
    public setMainHint(type: string, v: number): void {
        v = mathUtils.float(v, 0);
        this.data.set(type, v);
        this.emit(type, v, type);
    }

    /**
     * 修改红点数值（增量方式）
     * @param type 红点类型
     * @param v 变化量（可正负）
     * @example
     * // 增加未读邮件
     * hintCenter.changeHint('mail', 1);
     * 
     * // 减少任务数量
     * hintCenter.changeHint('quest', -1);
     */
    public changeHint(type: string, v: number): void {
        v = mathUtils.float(v, 0);
        let a = this.getHintValue(type) || 0;
        a += v;
        if (a < 0) a = 0;
        this.setHint(type, a);
    }

    /**
     * 添加子类型关联关系
     * @param type 主红点类型
     * @param subTypes 子类型或子类型数组
     * @example
     * // 将任务子类型关联到主任务红点
     * hintCenter.addSubType('taskMain', ['dailyTask', 'achievementTask']);
     */
    public addSubType(type: string, subTypes: string | string[]): void {
        subTypes = [].concat(subTypes);
        for (let i = 0, n = subTypes.length; i < n; i++) {
            const subType = subTypes[i];
            if (this.sub2Main[subType] == type) return;
            if (!this.data.has(type))
                this.data.set(type, 0);
            this.sub2Main[subType] = type;
            if (this.main2Subs[type] == null) this.main2Subs[type] = [];
            arrayUtils.addToArray(this.main2Subs[type], subType);
        }
    }

    /**
     * 移除子类型关联
     * @param type 主红点类型
     * @param subType 要移除的子类型
     * @example
     * // 移除过期的活动子类型
     * hintCenter.removeSubType('activity', 'xmasEvent');
     */
    public removeSubType(type: string, subType: string): void {
        delete this.sub2Main[subType];
        arrayUtils.removeFromArray(this.main2Subs[type], subType);
    }

    /**
     * 监听红点状态变化
     * @param type 要监听的红点类型
     * @param func 回调函数 function(count: number, type: string)
     * @param target 监听目标
     * @example
     * // 监听邮件红点变化
     * hintCenter.onHint('mail', (count, type) => {
     *   this.mailIcon.redDot = count > 0;
     * }, this);
     */
    public onHint(type: string, func: Function, target: any): void {
        this.on(type, func, target);
        if (this.data.has(type)) {
            this.checkHintType(type);
        }
    }

    /**
     * 移除指定目标的所有红点监听
     * @param target 要移除的监听目标
     * @example
     * // 在界面销毁时移除监听
     * onDestroy() {
     *   hintCenter.offHint(this);
     * }
     */
    public offHint(target: any): void {
        this.targetOff(target);
    }

    /**
     * 设置时间戳触发的红点
     * @param type 红点类型
     * @param time 触发时间戳（单位：毫秒）
     * @example
     * // 设置整点刷新红点
     * const nextHour = Date.now() + 3600000 - (Date.now() % 3600000);
     * hintCenter.setHintTimestamp('hourlyRefresh', nextHour);
     */
    public setHintTimestamp(type: string, time: number): void {
        if (time < dateUtils.timestamp()) {
            return;
        } else {
            if (this.timestampHit[type] == null || this.timestampHit[type] > time)
                this.timestampHit[type] = time;
        }
    }

    /**
     * 获取指定红点的当前数值
     * @param type 红点类型
     * @returns 当前红点数值（不存在返回null）
     * @example
     * // 检查背包红点状态
     * const count = hintCenter.getHintValue('backpack');
     * if (count > 0) this.showBagRedDot();
     */
    public getHintValue(type: string): number {
        if (this.data.has(type)) return this.data.get(type);
        return null;
    }

    /** 定时检查时间戳触发 */
    private checkHint(): boolean {
        no.forEach(this.timestampHit, (type, value) => {
            if (value <= dateUtils.timestamp()) {
                this.setHint(type, 1);
                delete this.timestampHit[type];
            }
            return false;
        });
        return true;
    }

    /** 触发红点状态更新 */
    private checkHintType(type: string) {
        const mainType = this.sub2Main[type];
        if (!mainType || mainType != type) {
            this.emit(type, this.getHintValue(type) || 0, type);
        }
        if (!mainType) return;

        const subTypes = this.main2Subs[mainType];
        let n = 0;
        if (subTypes) {
            let b: number[] = [];
            for (let i = 0, m = subTypes.length; i < m; i++) {
                const a = this.getHintValue(subTypes[i]);
                if (a != null) b.push(a);
            }
            if (b.length > 0) {
                n = b.reduce((a, b) => a + b);
                this.data.set(mainType, n);
            } else {
                n = this.data.get(mainType) || 0;
            }
        }
        this.emit(mainType, n, mainType);
    }

    /**
     * 清空所有红点数据
     * @example
     * // 用户登出时重置
     * onLogout() {
     *   hintCenter.clear();
     * }
     */
    public clear() {
        this.data.clear();
        this.timestampHit = {};
    }
}
/**全局红点管理器 */
export const hintCenter = new HintCenter();