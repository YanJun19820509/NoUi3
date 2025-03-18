
import { ccclass, property, executeInEditMode, EDITOR, Node, game, isValid } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetTurntable
 * DateTime = Tue Jan 31 2023 09:25:03 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetTurntable.ts
 * FileBasenameNoExtension = SetTurntable
 * URL = db://assets/NoUi3/ui/SetTurntable.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 转盘旋转
 * data: number--最终转盘角度angle
 */
@ccclass('SetTurntable')
@executeInEditMode()
/**
 * 转盘旋转控制组件
 * @功能说明：
 * - 通过数据驱动实现转盘平滑旋转效果
 * - 支持两种转速模式（快速旋转/减速阶段）
 * - 提供旋转状态回调接口
 * 
 * @使用示例：
 * // 通过数据绑定设置目标角度：
 * this.a_setData(720) // 转盘将旋转到720度位置
 * 
 * // 编辑器配置示例：
 * - 转速设为2（每秒转2圈）
 * - 转动时长设为3（至少转6圈后开始减速）
 * - 减速角度设为180（最后180度开始减速）
 */
export class SetTurntable extends HackUi {
    /**
     * 转盘节点引用
     * @规则：
     * - 未指定时默认使用当前节点
     * @示例
     * this.turntable = this.node // 使用自身节点作为转盘
     */
    @property({ displayName: '转盘节点' })
    turntable: Node = null;

    /**
     * 基础旋转速度（单位：圈/秒）
     * @规则：
     * - 实际角速度 = 360 * speed（度/秒）
     * - 影响快速阶段和减速阶段的基准速度
     */
    @property({ displayName: '转速(圈/秒)', min: 1 })
    speed: number = 1;

    /**
     * 最小转动持续时间（单位：秒）
     * @实现原理：
     * - 保证至少转动 speed * duration 圈后开始减速
     * - 用于控制最短旋转时间
     */
    @property({ displayName: '转动时长(秒)', min: 0 })
    duration: number = 0;

    /**
     * 减速触发角度阈值
     * @规则：
     * - 当剩余角度小于等于该值时进入减速阶段
     * - 减速阶段角速度 = 快速阶段角速度 / 20
     */
    @property({ displayName: '减速角度', min: 0, tooltip: '剩余多少角度时开始减速' })
    slowAngle: number = 0;

    // 减速阶段事件回调列表
    @property({ type: no.EventHandlerInfo, displayName: '转动减速回调' })
    slowdownCall: no.EventHandlerInfo[] = [];

    // 旋转结束事件回调列表
    @property({ type: no.EventHandlerInfo, displayName: '转动结束回调' })
    endCall: no.EventHandlerInfo[] = [];

    // 快速阶段角速度（度/秒）
    private quickAnglePerSecond: number;
    // 减速阶段角速度（度/秒）
    private slowAnglePerSecond: number;
    // 剩余需要旋转的总角度
    private turnningAngle: number = 0;
    // 减速回调是否已触发
    private slowdownCalled: boolean = false;

    onLoad() {
        super.onLoad();
        if (EDITOR) {
            // 编辑器模式下自动绑定当前节点
            if (!this.turntable) this.turntable = this.node;
        } else {
            // 计算实际角速度值
            this.quickAnglePerSecond = 360 * this.speed;
            this.slowAnglePerSecond = this.quickAnglePerSecond / 20;
        }
    }

    /**
     * 数据变更处理回调
     * @param data 目标停止角度（单位：度）
     * @实现原理：
     * - 将输入数据转换为目标角度
     * - 启动旋转流程
     */
    protected onDataChange(data: any) {
        if (!this.turntable?.isValid) return;
        this.setTurnning(Number(data));
    }

    /**
     * 初始化旋转参数
     * @param stopAngle 目标停止角度
     * @计算逻辑：
     * - 总旋转角度 = 目标角度差 + 保证持续时间的圈数角度
     * - 示例：当speed=2，duration=3时，至少转6圈（6*360=2160度）
     */
    private setTurnning(stopAngle: number) {
        this.slowdownCalled = false;
        this.turnningAngle = stopAngle - this.turntable.angle + Math.ceil(this.speed * this.duration) * 360;
        this.requestAnimationFrameTurn();
    }

    /**
     * 单帧旋转计算
     * @param dt 帧时间间隔（秒）
     * @实现逻辑：
     * 1. 根据剩余角度选择旋转速度
     * 2. 更新转盘角度和剩余角度
     * 3. 触发减速回调（仅一次）
     * 4. 递归调用直到旋转完成
     */
    private turnByFrame(dt: number) {
        if (!isValid(this?.node)) return;
        
        let a: number = 0;
        if (this.turnningAngle > this.slowAngle) {
            // 快速阶段计算
            a = this.quickAnglePerSecond * dt;
        } else {
            // 减速阶段计算
            a = this.slowAnglePerSecond * dt;
            if (!this.slowdownCalled) {
                this.slowdownCalled = true;
                no.EventHandlerInfo.execute(this.slowdownCall);
            }
        }

        // 更新转盘角度（取模处理超过360度的情况）
        this.turntable.angle = (this.turntable.angle + a) % 360;
        this.turnningAngle -= a;

        // 结束判断
        if (this.turnningAngle <= 0) {
            no.EventHandlerInfo.execute(this.endCall);
        } else {
            this.requestAnimationFrameTurn();
        }
    }

    /**
     * 请求下一帧更新
     * @实现原理：
     * - 使用requestAnimationFrame实现平滑动画
     * - 将帧时间转换为秒单位传递给turnByFrame
     */
    private requestAnimationFrameTurn() {
        requestAnimationFrame(() => {
            this?.turnByFrame(game.frameTime * .001);
        });
    }
}
