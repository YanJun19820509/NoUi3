import { no } from '../no';
import { ccclass } from '../yj';

/**
 * 任务优先级枚举
 * @enum {number}
 * @example
 * // 使用示例：
 * // 紧急任务（如用户输入响应）
 * TaskPriority.IMMEDIATE
 * // 后台预加载资源
 * TaskPriority.IDLE
 */
export enum TaskPriority {
    IMMEDIATE = 0,    // 立即执行（最高优先级，下一帧立即处理）
    HIGH = 1,         // 高优先级（重要任务，如关键资源加载）
    NORMAL = 2,       // 普通优先级（默认任务级别）
    LOW = 3,          // 低优先级（可延迟的后台任务）
    IDLE = 4          // 空闲时执行（当没有更高优先级任务时处理）
}

/**
 * 任务状态枚举
 * @enum {number}
 * @example
 * // 状态转换示例：
 * PENDING → RUNNING → COMPLETED
 * RUNNING → PAUSED → RUNNING → CANCELED
 */
export enum TaskStatus {
    PENDING,    // 等待执行（已加入队列但未开始）
    RUNNING,    // 执行中（正在处理的任务）
    PAUSED,     // 暂停（可恢复执行）
    COMPLETED,  // 完成（成功结束）
    CANCELED    // 取消（主动终止）
}

/**
 * 任务接口定义
 * @interface ITask
 * @example
 * // 创建任务示例：
 * const loadTask: ITask = {
 *     id: 1,
 *     priority: TaskPriority.HIGH,
 *     execute: async () => {
 *         await loadResources();
 *         return true;
 *     },
 *     progress: 0,
 *     status: TaskStatus.PENDING,
 *     timeSlice: 10,    // 每帧分配10ms执行
 *     timeout: 5000,    // 超时5秒
 *     context: { url: 'res/texture' }
 * };
 */
interface ITask {
    id: number;                           // 任务唯一ID（自动生成）
    priority: TaskPriority;               // 任务优先级（影响调度顺序）
    execute: () => boolean | Promise<boolean>;  // 任务执行函数，返回true表示完成，false需要继续执行
    progress?: number;                    // 执行进度 0-1（用于进度显示）
    status: TaskStatus;                   // 当前任务状态（自动更新）
    timeSlice?: number;                   // 单次执行时间片(ms)（默认16ms，保持帧率）
    timeout?: number;                     // 超时时间(ms)（0表示不超时）
    startTime?: number;                   // 开始时间戳（用于超时计算）
    context?: any;                        // 任务上下文数据（可携带业务参数）
}

/**
 * 全局任务调度管理器
 * 用于管理和执行异步任务队列
 */
@ccclass('YJJobManager')
export class YJJobManager {
    private static _instance: YJJobManager;

    private taskQueue: Map<TaskPriority, ITask[]> = new Map();
    private taskIdCounter: number = 0;
    private isRunning: boolean = false;
    private frameTimeBudget: number = 16; // 默认16ms
    private metricsHistory: number[] = [];
    private readonly METRICS_SAMPLE_SIZE = 60; // 保存60帧的性能数据

    // 性能监控阈值
    private readonly Date_THRESHOLDS = {
        GOOD: 14,      // 小于14ms认为性能良好
        WARNING: 16,   // 16ms警告
        CRITICAL: 20   // 20ms危险
    };

    /** 单例获取器 */
    public static get ins(): YJJobManager {
        if (!this._instance) {
            this._instance = new YJJobManager();
        }
        return this._instance;
    }

    constructor() {
        // 初始化优先级队列
        let priorities = Object.values(TaskPriority);
        for (let i = 0; i < priorities.length; i++) {
            let priority = priorities[i];
            if (typeof priority === 'number') {
                this.taskQueue.set(priority, []);
            }
        }
    }

    /**
     * 添加任务
     */
    public addTask(
        execute: () => boolean | Promise<boolean>,
        priority: TaskPriority = TaskPriority.NORMAL,
        timeSlice?: number,
        context?: any
    ): number {
        const task: ITask = {
            id: ++this.taskIdCounter,
            priority,
            execute,
            status: TaskStatus.PENDING,
            timeSlice,
            startTime: Date.now(),
            context,
            progress: 0
        };

        this.taskQueue.get(priority)!.push(task);

        if (!this.isRunning) {
            this.start();
        }

        return task.id;
    }

    /**
     * 开始执行任务队列
     */
    private start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.scheduleNextFrame();
    }

    /**
     * 调度下一帧
     */
    private scheduleNextFrame(): void {
        if (!this.isRunning) return;
        requestAnimationFrame(this.update.bind(this));
    }

    /**
     * 更新函数 - 核心执行逻辑
     */
    private async update(timestamp: number): Promise<void> {
        const frameStartTime = Date.now();
        let timeRemaining = this.frameTimeBudget;

        // 按优先级遍历任务队列
        for (let priority = TaskPriority.IMMEDIATE; priority <= TaskPriority.IDLE; priority++) {
            const tasks = this.taskQueue.get(priority)!;

            if (tasks.length === 0) continue;

            // 执行当前优先级的任务
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];

                // 检查是否还有足够的时间片
                if (timeRemaining <= 0 && priority !== TaskPriority.IMMEDIATE) {
                    break;
                }

                const taskStartTime = Date.now();

                try {
                    const result = await task.execute();

                    if (result) {
                        // 任务完成
                        task.status = TaskStatus.COMPLETED;
                        tasks.splice(i--, 1);
                    }
                } catch (error) {
                    console.error(`Task ${task.id} failed:`, error);
                    tasks.splice(i--, 1);
                }

                const taskDuration = Date.now() - taskStartTime;
                timeRemaining -= taskDuration;
            }
        }

        // 更新性能指标
        this.updateMetrics(Date.now() - frameStartTime);

        // 自适应调整帧时间预算
        this.adjustFrameBudget();

        // 继续下一帧
        this.scheduleNextFrame();
    }

    /**
     * 更新性能指标
     */
    private updateMetrics(frameDuration: number): void {
        this.metricsHistory.push(frameDuration);
        if (this.metricsHistory.length > this.METRICS_SAMPLE_SIZE) {
            this.metricsHistory.shift();
        }
    }

    /**
     * 动态调整帧时间预算
     */
    private adjustFrameBudget(): void {
        if (this.metricsHistory.length < this.METRICS_SAMPLE_SIZE) return;

        const avgFrameTime = this.metricsHistory.reduce((a, b) => a + b) / this.metricsHistory.length;

        if (avgFrameTime > this.Date_THRESHOLDS.CRITICAL) {
            this.frameTimeBudget = Math.max(this.frameTimeBudget - 2, 8);
        } else if (avgFrameTime < this.Date_THRESHOLDS.GOOD) {
            this.frameTimeBudget = Math.min(this.frameTimeBudget + 1, 16);
        }
    }

    /**
     * 取消任务
     */
    public cancelTask(taskId: number): boolean {
        let taskQueueValues = Array.from(this.taskQueue.values());
        for (let i = 0, n = taskQueueValues.length; i < n; i++) {
            let tasks = taskQueueValues[i];
            for (let j = 0, m = tasks.length; j < m; j++) {
                if (tasks[j].id === taskId) {
                    tasks[j].status = TaskStatus.CANCELED;
                    tasks.splice(j, 1);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 暂停任务
     */
    public pauseTask(taskId: number): boolean {
        let taskQueueValues = Array.from(this.taskQueue.values());
        for (let i = 0, n = taskQueueValues.length; i < n; i++) {
            let tasks = taskQueueValues[i];
            let task = null;
            for (let j = 0, m = tasks.length; j < m; j++) {
                let t = tasks[j];
                if (t.id === taskId) {
                    task = t;
                    break;
                }
            }
            if (task) {
                task.status = TaskStatus.PAUSED;
                return true;
            }
        }
        return false;
    }

    /**
     * 恢复任务
     */
    public resumeTask(taskId: number): boolean {
        let taskQueueValues = Array.from(this.taskQueue.values());
        for (let i = 0, n = taskQueueValues.length; i < n; i++) {
            let tasks = taskQueueValues[i];
            let task = null;
            for (let j = 0, m = tasks.length; j < m; j++) {
                let t = tasks[j];
                if (t.id === taskId) {
                    task = t;
                    break;
                }
            }
            if (task && task.status === TaskStatus.PAUSED) {
                task.status = TaskStatus.PENDING;
                return true;
            }
        }
        return false;
    }

    private _performanceStatsCache: { averageFrameTime: number, currentFrameBudget: number, taskCount: number } = { averageFrameTime: 0, currentFrameBudget: 0, taskCount: 0 };
    /**
     * 获取性能统计信息
     */
    public getPerformanceStats() {
        this._performanceStatsCache.averageFrameTime = this.metricsHistory.reduce((a, b) => a + b, 0) / this.metricsHistory.length;
        this._performanceStatsCache.currentFrameBudget = this.frameTimeBudget;
        this._performanceStatsCache.taskCount = Array.from(this.taskQueue.values()).reduce((sum, tasks) => sum + tasks.length, 0);
        return this._performanceStatsCache;
    }

    private performanceStatsInterval;
    public startPerformanceStats() {
        // 监控性能
        this.performanceStatsInterval = setInterval(() => {
            const stats = YJJobManager.ins.getPerformanceStats();
            console.log('Performance Stats:', stats);
        }, 1000);
    }

    public stopPerformanceStats() {
        clearInterval(this.performanceStatsInterval);
    }
}