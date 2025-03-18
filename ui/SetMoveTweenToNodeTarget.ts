
import { ccclass, property, requireComponent, UITransform, Vec3, math, Vec2, Enum } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { HackUi } from './HackUi';
import { SetNodeTweenAction } from './SetNodeTweenAction';
import { EasingType, EasingTypeName } from 'NoUi3/types';

/**
 * Predefined variables
 * Name = SetMoveTweenToNodeTarget
 * DateTime = Wed Jun 29 2022 18:05:22 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetMoveTweenToNodeTarget.ts
 * FileBasenameNoExtension = SetMoveTweenToNodeTarget
 * URL = db://assets/NoUi3/ui/SetMoveTweenToNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 * 将当前节点移动到指定节点位置
 */

@ccclass('SetMoveTweenToNodeTarget')
@requireComponent(SetNodeTweenAction)
/**
 * 缓动移动到目标节点的组件
 * @功能说明
 * - 提供两种移动模式：固定速度模式（根据距离自动计算时间）和固定时间模式
 * - 支持多种缓动动画效果
 * - 可设置目标位置偏移量
 * @应用场景
 * - UI元素平滑移动到指定位置
 * - 游戏对象跟随目标节点移动
 * - 动态调整物体位置时的过渡动画
 */
export class SetMoveTweenToNodeTarget extends HackUi {

    @property({ displayName: '根据速度计算时间' })
    fixSpeed: boolean = true;
    /**
     * @example
     * // true - 根据距离和速度计算移动时间（移动时间 = 距离/速度）
     * // false - 直接使用指定的移动时间
     */

    @property({ min: 1, displayName: '移动速度', tooltip: '移动速度', visible() { return this.fixSpeed; } })
    speed: number = 10;
    /** 像素/秒，仅在fixSpeed为true时生效 */

    @property({ min: 0.01, displayName: '移动时间(s)', visible() { return !this.fixSpeed; } })
    time: number = 1;
    /** 固定移动时长，仅在fixSpeed为false时生效 */

    @property
    offset: Vec2 = math.v2();
    /** 
     * 目标位置偏移量 
     * @example
     * // 设置x:50,y:-30将在目标位置基础上向右偏移50像素，向下偏移30像素
     */

    @property({ type: Enum(EasingType) })
    easing: EasingType = EasingType.LINEAR;
    /** 缓动动画类型，支持各种缓动效果如quadInOut、backIn等 */

    /**
     * 处理数据变更入口
     * @param data 目标节点标识符 
     * @example
     * // 移动到标记为"player"的节点位置：
     * component.a_setData('player');
     */
    protected onDataChange(data: any) {
        this.setTween(data);
    }

    /**
     * 设置缓动动画到目标节点
     * @param targetType 节点目标管理器注册的节点标识
     * @流程说明
     * 1. 从节点目标管理器获取目标节点
     * 2. 目标不存在时延迟重试（每帧检测直到目标可用）
     * 3. 转换目标位置到本地坐标系
     * 4. 计算移动距离和持续时间
     * 5. 配置并启动缓动动画组件
     * @示例
     * // 将血条移动到BOSS节点位置：
     * this.setTween('BOSS_HP_POSITION');
     */
    protected setTween(targetType: string) {
        // 从节点目标管理器获取目标节点引用
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            // 目标节点未就绪时，延迟重试机制
            this.scheduleOnce(() => {
                this.setTween(targetType);
            });
            return;
        }

        // 获取目标节点的世界坐标并转换为本地坐标系
        let pos = target.nodeWorldPosition;
        this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        
        // 计算移动参数
        let p = this.node.position;
        let dis = Vec3.distance(p, pos); // 三维空间距离计算
        let duration = this.fixSpeed ? dis / this.speed : this.time; // 持续时间计算策略
        
        // 配置缓动动画组件参数
        this.getComponent(SetNodeTweenAction).a_setData({
            duration: duration, // 动画持续时间
            to: 1,             // 动画进度终点值
            props: {           // 目标属性值
                pos: [
                    pos.x + this.offset.x, // 应用水平偏移
                    pos.y + this.offset.y  // 应用垂直偏移
                ]
            },
            easing: EasingTypeName[this.easing] // 使用配置的缓动函数
        });
    }
}
