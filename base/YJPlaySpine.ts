import { ccclass, Component, property, requireComponent, Skeleton } from "../yj";
import { no } from "../no";
/**
 * 
 * Author mqsy_yj
 * DateTime Wed Sep 10 2025 14:21:52 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJPlaySpine')
@requireComponent(Skeleton)
export class YJPlaySpine extends Component {
    @property
    autoPlayOnEnable: boolean = false;
    // 动画开始事件处理器（示例：在动画开始时播放音效）
    @property({ type: no.EventHandlerInfo, displayName: '动画播放开始回调' })
    startCall: no.EventHandlerInfo = new no.EventHandlerInfo();
    // 动画结束事件处理器（示例：在动画结束时切换界面）
    @property({ type: no.EventHandlerInfo, displayName: '动画播放结束回调' })
    endCall: no.EventHandlerInfo = new no.EventHandlerInfo();

    private _curSpine: Skeleton;
    onEnable() {
        this._curSpine = this.getComponent(Skeleton);
        // 自动播放配置检查
        if (this.autoPlayOnEnable && this._curSpine.enabled) {
            this.bindStartCall(); // 动画开始回调
            this.bindEndCall(); // 动画结束回调
            this._play(this._curSpine); // 执行播放
        }
    }

    /**
     * 实际执行动画播放的核心方法
     * @param spine 骨骼动画组件实例
     * @param animationName 要播放的动画名称
     * @param loop 是否循环播放
     * @规则：
     * - 检查Spine功能是否启用
     * - 验证动画数据是否存在
     * - 检查节点激活状态
     * - 最终设置动画
     * @example
     * // 当节点未激活时输出警告：
     * "spine节点player未在场景中激活"
     */
    private _play(spine: Skeleton) {
        if (!no.spineEnable()) return;

        // 设置动画到轨道0
        if (spine?._skeleton?.data) {
            spine.setAnimation(0, spine.animation, spine.loop);
        }
    }

    /**
     * 绑定动画开始回调
     * @规则：
     * - 当Spine功能可用时使用原生事件监听
     * - 不可用时使用定时器模拟
     * - 通过_startIndexes过滤需要处理的队列索引
     * @示例
     * // 在加载Spine资源时调用：
     * this.bindStartCall();
     */
    private bindStartCall() {
        if (no.spineEnable()) {
            // 原生事件监听模式
            this._curSpine?.setStartListener(() => {
                this._startCb();
            });
        } else {
            this._startCb();
        }
    }
    private _startCb() {
        this._curSpine?.setStartListener(() => { }); // 单次监听自动移除
        this?.startCall.execute(this._curSpine);
    }

    /**
     * 绑定动画结束回调
     * @规则：
     * - 动画结束后自动重置Spine数据
     * - 处理逻辑同bindStartCall
     * @示例
     * // 在播放动画时调用：
     * this.bindEndCall();
     */
    private bindEndCall() {
        if (no.spineEnable()) {
            this._curSpine?.setCompleteListener(() => {
                this._endCb();
            });
        } else {
            // 模拟模式：延迟1秒后执行
            this.scheduleOnce(this._endCb, 1);
        }
    }
    private _endCb() {
        this._curSpine?.setCompleteListener(() => { }); // 单次监听自动移除
        this?.endCall.execute(this._curSpine);
    }
}