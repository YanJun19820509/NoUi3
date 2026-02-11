
import { ccclass, property, menu, Node } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';
import { TweenSet, parseTweenData, TweenSetPlay } from '../extend/TweenSet';

/**
 * Predefined variables
 * Name = SetNodeTweenAction
 * DateTime = Mon Jan 17 2022 09:21:41 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetNodeTweenAction.ts
 * FileBasenameNoExtension = SetNodeTweenAction
 * URL = db://assets/Script/common/ui/SetNodeTweenAction.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetNodeTweenAction')
@menu('NoUi/ui/SetNodeTweenAction(设置节点缓动效果:object|[object])')
/**
 * 节点缓动动画控制组件
 * @示例 
 * // 通过数据驱动方式触发缓动：
 * // 数据格式示例（支持对象或对象数组）：
 * // {
 * //   duration: 1,    // 动画时长（秒）
 * //   props: {        // 要改变的属性值
 * //     position: [100, 200], 
 * //     scale: [1.5, 1.5]
 * //   },
 * //   ease: "quadOut" // 缓动函数类型
 * // }
 * // 或数组形式配置多个连续动画
 */
export class SetNodeTweenAction extends HackUi {
    /**
     * 缓动动画开始前触发的事件回调
     * @示例 [{"component":"TestCtrl","handler":"onTweenStart","customEventData":"data"}]
     */
    @property({ type: no.EventHandlerInfo, displayName: '缓动开始前回调' })
    beforeCall: no.EventHandlerInfo[] = [];

    /**
     * 缓动动画完成后触发的事件回调
     * @示例 [{"component":"TestCtrl","handler":"onTweenEnd"}]
     */
    @property({ type: no.EventHandlerInfo, displayName: '缓动完成回调' })
    endCall: no.EventHandlerInfo[] = [];

    /**
     * 指定要执行缓动的目标节点（留空则使用当前节点）
     * @type {Node}
     */
    @property({ type: Node, displayName: '缓动目标' })
    targetNode: Node = null;

    /**
     * 是否在组件禁用时自动停止缓动
     * @规则 启用时onDisable会自动调用stop方法
     */
    @property({ tooltip: '组件禁用时是否停止缓动' })
    canDisable: boolean = false;

    // 当前缓动动画实例（支持单个或数组）
    private _action: TweenSet | TweenSet[];

    /**
     * 组件禁用时回调
     * @条件 当canDisable为true时生效
     */
    onDisable() {
        if (this.canDisable)
            this.stop();
    }

    /**
     * 数据变化处理入口
     * @param data 缓动配置数据，支持两种格式：
     * - 对象格式：单个缓动配置 
     * - 数组格式：多个连续缓动配置
     * @示例 {duration:1, props:{position:[100,200]}}  // 移动到(100,200)
     * @示例 [{duration:0.5,props:{scale:[2,2]}}, {duration:1,props:{rotation:360}}] // 先放大再旋转
     */
    protected onDataChange(data: any) {
        this.stop();
        // 过滤空数据
        if (Object.keys(data).length == 0) return;
        // 执行前置回调
        no.EventHandlerInfo.execute(this.beforeCall);
        // 创建缓动动画
        this._action = this.createAction(data);
        // 运行动画
        this.run();
    }

    /**
     * 创建缓动动画实例
     * @param data 缓动配置数据
     * @returns 缓动动画实例或实例数组
     */
    protected createAction(data: any): TweenSet | TweenSet[] {
        return parseTweenData(data, this.targetNode || this.node);
    }

    /**
     * 执行缓动动画
     * @流程 1.播放动画 2.动画完成后执行endCall回调
     */
    private run() {
        TweenSetPlay(this._action, () => {
            no.EventHandlerInfo.execute(this.endCall);
        });
    }

    /**
     * 停止当前所有缓动动画
     * @安全 自动处理单个/多个动画实例的停止
     */
    private stop() {
        if (this._action instanceof Array) {
            // 使用传统for循环保证最低环境兼容性
            for (let i = 0; i < this._action.length; i++) {
                this._action[i].stop();
            }
        } else {
            this._action?.stop();
        }
        this._action = null;
    }
}
