import { ccclass, isValid, property } from '../../common/yj';
import { no } from '../no';
import { SetTimeCountDown } from './SetTimeCountDown';

/**
 * 计时器
 * Author mqsy_yj
 * DateTime Thu Jun 26 2025 11:24:41 GMT+0800 (中国标准时间)
 * data:string|number|number[],显示文本|计时最大时长|[已计时时长，最大时长]，最大时长达到后停止计时，如果最大时长==0则无限计时，==-1时停止计时
 */

@ccclass('SetTimer')
export class SetTimer extends SetTimeCountDown {
    /**
     * 是否启用定时触发功能
     * @规则：
     * - 需要配合time属性使用
     * @示例 
     * 设置60秒时触发特殊事件
     */
    @property({ displayName: '间隔触发' })
    isInterval: boolean = false;

    @property({ min: 0, step: 1, displayName: '间隔触发时间', visible() { return this.isInterval; } })
    interval: number = 60;

    @property({ type: no.EventHandlerInfo, displayName: '间隔回调', visible() { return this.isInterval; } })
    intervalCalls: no.EventHandlerInfo[] = [];

    protected _start: number;

    protected onDataChange(data: any) {
        no.sysTime.offTickTock(this);

        if (data == 'stop') {
            return;
        }

        // 处理直接显示文本的情况
        if (typeof data == 'string' && isNaN(Number(data))) {
            this.setLabel(data);
            return;
        }

        const now = no.sysTime.now;

        // 处理数组参数格式[已计时时长，最大时长]
        if (data instanceof Array) {
            const [start, max] = data;
            if (start >= max) {
                this.setLabel('');
                return;
            }
            this._deadline = max + now;
            this._max = max;
            this._start = start + now;
        }
        // 处理数字参数格式
        else {
            const max = data;
            if (max <= 0) {
                this.setLabel('');
                return;
            }
            this._deadline = max + now;
            this._max = max;
            this._start = now;
        }

        this.doTickTock(now);
        no.sysTime.onTickTock(this);
    }

    /**
     * 执行计时更新
     * @param now 当前时间戳（秒）
     * @实现逻辑：
     * 1. 计算剩余时间
     * 2. 触发时间相关回调
     * 3. 更新显示内容
     * 4. 计算并传递百分比
     */
    public doTickTock(now: number) {
        if (!isValid(this.node, true)) return;

        const duration = now - this._start;

        // 更新进度百分比
        this.setPercent(this._max - duration);

        // 计时结束处理
        if (duration >= this._max) {
            no.sysTime.offTickTock(this);
            no.EventHandlerInfo.execute(this.endCalls);
            return;
        }
        // 计时进行中处理
        else {
            no.EventHandlerInfo.execute(this.secondCalls);

            // 触发定时回调
            if (this.isTime && duration === this.time) {
                no.EventHandlerInfo.execute(this.timeCalls);
            }
            // 触发间隔回调
            if (this.isInterval && duration % this.interval === 0) {
                no.EventHandlerInfo.execute(this.intervalCalls);
            }
        }

        // 更新文本显示
        if (this.isLabel) {
            const formatted = this.decorator
                ? this.decorator.format(duration)
                : no.sec2time(duration, this.formatter, this.show0);
            this.setLabel(formatted);
        }
    }
}
