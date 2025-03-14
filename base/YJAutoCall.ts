
import { ccclass, property, menu, Component, Node } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJAutoCall
 * DateTime = Fri Jan 14 2022 17:51:46 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJAutoCall.ts
 * FileBasenameNoExtension = YJAutoCall
 * URL = db://assets/Script/NoUi3/base/YJAutoCall.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJAutoCall')
@menu('NoUi/base/YJAutoCall(自动执行)')
/**
 * 自动执行组件
 * @description 用于在特定时机自动执行预设的回调方法
 * @example
 * // 在编辑器中使用时：
 * // 1. 将组件挂载到节点
 * // 2. 配置回调事件列表（calls）
 * // 3. 设置触发条件（加载时/激活时）
 * 
 * @example
 * // 激活时立即执行：
 * // - 勾选 callOnEnable
 * // - delay 设置为 0
 * 
 * @example
 * // 加载时延迟1秒执行（仅一次）：
 * // - 勾选 callOnLoad 和 once
 * // - delay 设置为 1000
 */
export class YJAutoCall extends Component {
    @property({ displayName: '延时(ms)', min: 0, step: 1 })
    delay: number = 0;

    @property(no.EventHandlerInfo)
    calls: no.EventHandlerInfo[] = [];

    @property({ displayName: '加载时执行' })
    callOnLoad: boolean = false;

    @property({ displayName: '激活时执行' })
    callOnEnable: boolean = false;

    @property({ displayName: '仅执行一次' })
    once: boolean = false;

    private _done = false;

    /** 节点加载完成时回调 */
    onLoad() {
        this.callOnLoad && !this.callOnEnable && this.a_call();
    }

    /** 组件激活时回调 */
    onEnable() {
        this.callOnEnable && this.a_call();
    }

    /**
     * 执行预设回调
     * @description 会先取消所有已安排的执行，保证只执行最新调用
     */
    public a_call() {
        if (this.once && this._done) return;
        this.unscheduleAllCallbacks();
        this._done = true;
        this.scheduleOnce(() => {
            no.EventHandlerInfo.execute(this.calls);
        }, this.delay / 1000);
    }

    /** 停止所有预定回调 */
    public a_stop() {
        this.unscheduleAllCallbacks();
    }
}
