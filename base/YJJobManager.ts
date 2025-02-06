import { ccclass } from '../yj';
import { no } from '../no';

/** 任务接口定义 */
interface IJob {
    func: Function;
    target: any;
    args?: any[];
    resolve: (value?: any) => void;
}

/**
 * 全局任务调度管理器
 * 用于管理和执行异步任务队列
 */
@ccclass('YJJobManager')
export class YJJobManager {
    private static _instance: YJJobManager;

    // 使用 Map 存储任务，提供更好的性能
    private jobs: Map<string, IJob> = new Map();
    // 使用 Set 存储活动任务ID，提高查找效率
    private activeJobs: Set<string> = new Set();
    // 任务队列
    private jobQueue: string[] = [];

    // 任务处理状态
    private isProcessing: boolean = false;
    // 每帧最大处理时间（毫秒）
    private readonly MAX_PROCESS_TIME: number = 5;
    // 是否立即执行所有任务
    private executeImmediately: boolean = false;

    /** 单例获取器 */
    public static get ins(): YJJobManager {
        if (!this._instance) {
            this._instance = new YJJobManager();
            this._instance.startProcessing();
        }
        return this._instance;
    }

    /**
     * 添加并执行任务
     * @param func 执行函数
     * @param target 执行上下文
     * @param args 函数参数
     * @returns Promise
     */
    public async execute(func: Function, target: any, args?: any): Promise<any> {
        if (!func || !target) {
            throw new Error('[YJJobManager] Invalid function or target');
        }

        const jobId = no.uuid();

        this.activeJobs.add(jobId);
        this.jobQueue.push(jobId);

        let p = new Promise((resolve) => {
            this.jobs.set(jobId, {
                func,
                target,
                args,
                resolve
            });
        }).catch(e => {
            console.error(e);
        });

        // 如果设置为立即执行，则直接处理任务
        if (this.executeImmediately) {
            this.processJobs();
        }
        return p;
    }

    /**
     * 开始任务处理循环
     */
    private startProcessing(): void {
        const processFrame = () => {
            this.processJobs();
            // 使用 requestAnimationFrame 进行下一帧处理
            requestAnimationFrame(processFrame);
        };

        requestAnimationFrame(processFrame);
    }

    /**
     * 处理任务队列
     */
    private processJobs(): Promise<void> {
        if (this.isProcessing || this.jobQueue.length === 0) return;

        this.isProcessing = true;
        const startTime = this.getCurrentTime();

        try {
            while (this.jobQueue.length > 0) {
                // 检查处理时间是否超过限制
                if (!this.executeImmediately &&
                    this.getCurrentTime() - startTime > this.MAX_PROCESS_TIME) {
                    break;
                }

                const jobId = this.jobQueue[0];
                const job = this.jobs.get(jobId);

                if (!job) continue;

                if (!this.isValidTarget(job.target)) {
                    this.jobQueue.shift();
                    this.removeJob(jobId);
                    job.resolve();
                    continue;
                }

                try {
                    const result = job.func.call(job.target, job.args);
                    if (result !== false) {
                        continue;
                    }
                } catch (error) {
                    console.error('[YJJobManager] Job execution error:', error);
                }
                this.jobQueue.shift();
                this.removeJob(jobId);
                job.resolve();
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 移除任务
     */
    private removeJob(jobId: string): void {
        this.jobs.delete(jobId);
        this.activeJobs.delete(jobId);
    }

    /**
     * 检查目标对象是否有效
     */
    private isValidTarget(target: any): boolean {
        return target && no.checkValid(target);
    }

    /**
     * 获取当前时间戳
     */
    private getCurrentTime(): number {
        return no.sysTime.locationNow;
    }

    /**
     * 设置是否立即执行任务
     */
    public setExecuteImmediately(value: boolean): void {
        this.executeImmediately = value;
    }

    /**
     * 清理所有任务
     */
    public clear(): void {
        this.jobs.clear();
        this.activeJobs.clear();
        this.jobQueue.length = 0;
        this.isProcessing = false;
    }

    /**
     * 获取当前任务数量
     */
    public get jobCount(): number {
        return this.activeJobs.size;
    }
}
