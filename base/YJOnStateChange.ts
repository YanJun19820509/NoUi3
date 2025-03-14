
import { ccclass, property, Component, isValid, macro } from '../yj';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJOnStateChange
 * DateTime = Fri Sep 09 2022 15:31:37 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJOnStateChange.ts
 * FileBasenameNoExtension = YJOnStateChange
 * URL = db://assets/NoUi3/base/YJOnStateChange.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//监听no.state状态组件
/**
 * 状态值配置信息
 * @description 定义特定状态值对应的处理程序集合
 * @example
 * // 示例配置：
 * { value: 'ready', handlers: [按钮点击事件] }
 */
@ccclass('StateValueInfo')
export class StateValueInfo {
    /** 匹配的状态值字符串 */
    @property
    value: string = '';
    /** 对应的处理程序列表 */
    @property({ type: no.EventHandlerInfo })
    handlers: no.EventHandlerInfo[] = [];
}

/**
 * 状态配置信息
 * @description 定义状态监听规则和对应值处理配置
 * @example
 * // 示例配置：
 * { key: 'playerState', values: [{value:'idle', handlers:[...]}] }
 */
@ccclass('StateInfo')
export class StateInfo {
    /** 要监听的状态键名 */
    @property
    key: string = '';
    /** 状态值处理配置列表 */
    @property({ type: StateValueInfo })
    values: StateValueInfo[] = [];

    /**
     * 状态变化处理
     * @param value 当前状态值 
     * @description 当检测到状态变化时，匹配对应值的处理程序并执行
     */
    public onStateChange(value: any) {
        for (let i = 0, n = this.values.length; i < n; i++) {
            let svi = this.values[i];
            if (svi.value == String(value)) {
                no.EventHandlerInfo.execute(svi.handlers);
                break;
            }
        }
    }
}

/**
 * 状态变化监听组件
 * @description 提供状态监听功能，支持多状态轮询检测和事件响应
 * @example
 * // 编辑器配置示例：
 * 1. 添加本组件到节点
 * 2. 在states中配置:
 *    - key: 要监听的状态键（如'playerState'）
 *    - values: 状态值配置数组（如[{value:'idle', handlers:[...]}])
 * 
 * @example
 * // 代码使用示例：
 * // 获取状态监听组件
 * const stateListener = this.node.getComponent(YJOnStateChange);
 * // 手动触发状态检查
 * stateListener.check();
 */
@ccclass('YJOnStateChange')
export class YJOnStateChange extends Component {
    /** 状态配置列表 */
    @property({ type: StateInfo })
    states: StateInfo[] = [];

    /** 轮询检查索引 */
    private _idx: number = 0;

    /** 启用时开始定时检查 */
    protected onEnable(): void {
        this.schedule(this.check, .1, macro.REPEAT_FOREVER);
    }

    /** 禁用时停止检查 */
    protected onDisable(): void {
        this.unschedule(this.check);
    }

    /**
     * 状态检查方法
     * @description 采用轮询方式逐个检查配置的状态，每0.1秒执行一次
     * 使用round-robin算法轮流检查不同状态，降低单帧性能消耗
     */
    private check() {
        if (!isValid(this?.node)) return;
        if (this._idx >= this.states.length) this._idx = 0;
        const state = this.states[this._idx];
        let a = no.state.check(state.key, this);
        if (a.state) state.onStateChange(a.value == undefined ? '' : a.value);
        this._idx++;
    }
}
