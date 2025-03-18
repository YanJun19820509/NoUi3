
import { EDITOR, ccclass, property, menu, Node, EventHandler, Slider } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetSliderProgress
 * DateTime = Mon Jan 17 2022 14:30:52 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSliderProgress.ts
 * FileBasenameNoExtension = SetSliderProgress
 * URL = db://assets/Script/NoUi3/ui/SetSliderProgress.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetSliderProgress')
@menu('NoUi/ui/SetSliderProgress(设置滑块进度:number(0-1))')
/**
 * 滑块进度控制组件
 * @example
 * // 编辑器中使用方式：
 * // 1. 添加Slider组件到节点
 * // 2. 添加该组件并配置事件回调：
 * //    - onProgressChange: 绑定进度变化时的处理函数（参数：0-1的数值）
 * //    - onProgressChangeEnd: 绑定触摸结束时的处理函数
 * // 3. 通过setData(0.5)设置进度值
 */
export class SetSliderProgress extends HackUi {

    @property({
        type: no.EventHandlerInfo,
        tooltip: '进度变化时的事件回调（参数：当前进度0-1）\n示例：绑定函数形如 (progress: number) => {}'
    })
    onProgressChange: no.EventHandlerInfo[] = [];

    @property({
        type: no.EventHandlerInfo,
        tooltip: '触摸结束事件回调\n示例：绑定无参函数'
    })
    onProgressChangeEnd: no.EventHandlerInfo[] = [];

    onLoad() {
        super.onLoad();
        // 编辑器模式下不初始化事件
        if (EDITOR) return;

        // 创建Slider事件处理器
        const eventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = 'SetSlider'; // 指向当前组件类名
        eventHandler.handler = 'onSliderEvent';
        
        // 获取Slider组件并添加事件监听
        const slider = this.getComponent(Slider);
        slider.slideEvents.push(eventHandler);
        
        // 绑定触摸结束事件（包含正常结束和取消）
        this.node.on(Node.EventType.TOUCH_END, this.onEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onEnd, this);
    }

    /**
     * 数据更新处理方法
     * @param data 进度值（0-1之间的数值或可转换为数值的类型）
     */
    protected onDataChange(data: any) {
        const slider = this.getComponent(Slider);
        if (!slider) return;
        
        // 转换为数值类型并设置进度
        const progress = Number(data);
        slider.progress = Math.min(1, Math.max(0, progress)); // 确保在0-1范围内
    }

    /**
     * Slider事件处理
     * @param slider 触发事件的Slider组件实例
     */
    private onSliderEvent(slider: Slider) {
        // 执行所有注册的回调，传递当前进度值
        no.EventHandlerInfo.execute(this.onProgressChange, slider.progress);
    }

    /**
     * 触摸结束处理
     */
    private onEnd() {
        // 执行所有注册的结束回调
        no.EventHandlerInfo.execute(this.onProgressChangeEnd);
    }
}
