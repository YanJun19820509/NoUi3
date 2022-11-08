
import { _decorator, Component, Node, sys, game } from 'cc';
import { no } from '../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJJobManager
 * DateTime = Mon Oct 31 2022 17:10:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJJobManager.ts
 * FileBasenameNoExtension = YJJobManager
 * URL = db://assets/NoUi3/base/YJJobManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
type YJJob = { func: Function, target: any, args?: any };
//任务管理器，管理全局任务的调度执行
@ccclass('YJJobManager')
export class YJJobManager extends Component {
    public static ins: YJJobManager;
    private jobs: { [k: string]: YJJob } = {};
    private jobKeys: string[] = [];
    private lastJobKeyIndex: number = 0;
    private needRemoveJobKeys: string[] = [];
    private frameStartTime: number = 0;

    onLoad() {
        YJJobManager.ins = this;
    }

    onDestroy() {
        YJJobManager.ins = null;
    }

    /**
     * 由管理器来执行
     * @param func 执行函数, 如果函数返回false将停止该任务的执行
     * @param target 执行函数对象
     */
    public async execute(func: Function, target: any, args?: any): Promise<void> {
        const k = no.uuid();
        this.jobs[k] = { func: func, target: target, args: args };
        this.jobKeys[this.jobKeys.length] = k;
        return await no.waitFor(() => {
            return this.jobKeys.indexOf(k) == -1;
        }, this);
    }

    private executePerFrame(frameEndTime: number) {
        let aa = true;
        while (aa) {
            if (sys.now() >= frameEndTime) {
                // console.log('executePerFrame end')
                aa = false;
                return;
            }
            let n = this.jobKeys.length;
            if (n == 0) {
                aa = false;
                return;
            }
            this.clearRemoveKeys();
            let k: string, job: YJJob;
            for (let i = this.lastJobKeyIndex; i < n; i++) {
                k = this.jobKeys[i];
                job = this.jobs[k];
                if (!job || !job.target.isValid || job.func.call(job.target, job.args) === false) this.addNeedRemoveKey(k);
                const a = sys.now() - frameEndTime;
                if (a >= 0) {
                    // console.log('executePerFrame end2', a)
                    this.lastJobKeyIndex = i;
                    aa = false;
                    return;
                }
            }
            this.lastJobKeyIndex = 0;
        }
    }

    private addNeedRemoveKey(k: string) {
        no.addToArray(this.needRemoveJobKeys, k);
    }

    private clearRemoveKeys() {
        if (this.needRemoveJobKeys.length == 0) return;
        let k: string;
        for (let i = this.jobKeys.length - 1; i >= 0; i--) {
            k = this.jobKeys[i];
            if (this.needRemoveJobKeys.indexOf(k) > -1) {
                this.jobKeys.splice(i, 1);
                delete this.jobs[k];
                if (this.lastJobKeyIndex > i) this.lastJobKeyIndex--;
            }
        }
        this.needRemoveJobKeys = [];
    }

    update() {
        this.frameStartTime = sys.now();
    }

    lateUpdate() {
        this.executePerFrame(this.frameStartTime + game.frameTime);
    }
}
