

/**
 * Predefined variables
 * Name = TimeWatcher
 * DateTime = Wed Aug 17 2022 14:07:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = TimeWatcher.ts
 * FileBasenameNoExtension = TimeWatcher
 * URL = db://assets/common/TimeWatcher.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

import { no } from "./no";
import { ccclass, sys } from "./yj";

/**debug用时间日志 */
/**
 * 时间监控工具类（用于性能调试和耗时检测）
 * @example
 * // 在代码关键点插入性能检测
 * TimeWatcher.blink('资源加载前');
 * await loadAssets();
 * TimeWatcher.blink('资源加载后');
 * 
 * // 测量代码块执行时间
 * const timer = TimeWatcher.start('AI计算');
 * runAIAlgorithm();
 * no.log(`AI耗时：${timer.checkLag()}ms`);
 */
@ccclass('TimeWatcher')
export class TimeWatcher {
    /** 静态时间戳缓存（用于连续时间点检测） */
    private static t: number = 0;

    /**
     * 记录相邻两个时间点间隔（输出到控制台）
     * @param Evn - 上下文标识（用于区分不同检测点）
     * @example
     * // 在循环中检测单次迭代耗时
     * for(let i=0; i<100; i++){
     *   TimeWatcher.blink('物理计算');
     *   runPhysics();
     * }
     */
    public static blink(Evn?: string): void {
        let t = sys.now();
        no.warn('TimeWatcher', Evn || 'blink', t, t - this.t);
        this.t = t;
    }

    /** 实例级时间戳（用于持续时长跟踪） */
    private t1: number = 0;
    
    /**
     * 创建计时器实例并开始计时
     * @param Evn - 计时器标识（可用于区分不同计时器）
     * @returns 计时器实例
     * @example
     * // 启动网络请求计时
     * const netTimer = TimeWatcher.start('HTTP请求');
     * fetch(url).then(() => {
     *   no.log(`请求耗时：${netTimer.checkLag()}ms`);
     * });
     */
    public static start(Evn?: string): TimeWatcher {
        const a = new TimeWatcher();
        a.t1 = no.sysTime.locationNow;
        return a;
    }

    /**
     * 计算并返回与上次检测的时间间隔（单位：毫秒）
     * @returns 时间间隔（毫秒）
     * @example
     * // 分阶段检测耗时
     * const timer = TimeWatcher.start();
     * processStage1();
     * no.log(`阶段1耗时：${timer.checkLag()}ms`);
     * processStage2();
     * no.log(`阶段2耗时：${timer.checkLag()}ms`);
     */
    public checkLag(): number {
        const t2 = no.sysTime.locationNow;
        const a = t2 - this.t1;
        this.t1 = t2;
        return a;
    }
}