
import { ccclass, property, requireComponent, UITransform, Vec3, math, Vec2, Enum, view, Node } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { HackUi } from './HackUi';
import { SetNodeTweenAction } from './SetNodeTweenAction';
import { EasingType, EasingTypeName } from '../types';

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
 * data:string|{target:string,subTypes:string[]},目标节点标识符，子节点路径数组
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
    @property({ type: Node, displayName: '边界节点', tooltip: '边界节点，用于限制相机移动范围' })
    boundaryNode: Node = null;
    @property({ displayName: '水平移动' })
    horizontal: boolean = true;
    @property({ displayName: '垂直移动' })
    vertical: boolean = true;

    /**
     * @example
     * // true - 根据距离和速度计算移动时间（移动时间 = 距离/速度）
     * // false - 直接使用指定的移动时间
     */
    @property({ displayName: '根据速度计算时间' })
    fixSpeed: boolean = true;

    /** 像素/秒，仅在fixSpeed为true时生效 */
    @property({ min: 1, displayName: '移动速度', tooltip: '移动速度', visible() { return this.fixSpeed; } })
    speed: number = 10;

    /** 固定移动时长，仅在fixSpeed为false时生效 */
    @property({ min: 0.01, displayName: '移动时间(s)', visible() { return !this.fixSpeed; } })
    time: number = 1;

    /** 
     * 目标位置偏移量 
     * @example
     * // 设置x:50,y:-30将在目标位置基础上向右偏移50像素，向下偏移30像素
     */
    @property
    offset: Vec2 = math.v2();

    /** 缓动动画类型，支持各种缓动效果如quadInOut、backIn等 */
    @property({ type: Enum(EasingType) })
    easing: EasingType = EasingType.LINEAR;

    /** 是否反向移动 */
    @property
    reverse: boolean = false;

    @property({ type: no.EventHandlerInfo, displayName: '移动中回调' })
    movingCall: no.EventHandlerInfo[] = [];

    private _range: { xMin: number, xMax: number, yMin: number, yMax: number };
    private _followData: { duration: number, speed: number, radian: number };

    /**
     * 处理数据变更入口
     * @param data 目标节点标识符 
     * @example
     * // 移动到标记为"player"的节点位置：
     * component.a_setData('player');
     */
    protected onDataChange(data: any) {
        if (this.boundaryNode && !this._range) {
            const viewSize = view.getVisibleSize();
            const size = no.size(this.boundaryNode);
            const width = (size.width - viewSize.width) / 2;
            const height = (size.height - viewSize.height) / 2;
            this._range = {
                xMin: -width,
                xMax: width,
                yMin: -height,
                yMax: height
            };
        }
        if (typeof data == 'string') {
            this.setTween(data);
        } else if (typeof data == 'object') {
            this.setTween(data.target, data.subTypes);
        }
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
    protected setTween(targetType: string, subTypes?: string[]) {
        // 从节点目标管理器获取目标节点引用
        let target: YJNodeTarget;
        if (subTypes) {
            target = no.nodeTargetManager.getSub<YJNodeTarget>(targetType, subTypes);
        } else {
            target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        }
        if (!target) {
            // 目标节点未就绪时，延迟重试机制
            this.scheduleOnce(() => {
                this.setTween(targetType, subTypes);
            });
            return;
        }

        // 获取目标节点的世界坐标并转换为本地坐标系
        let pos = target.nodeWorldPosition;
        no.worldPositionInNode(pos, this.boundaryNode || this.node.parent, pos);
        if (this.reverse) {
            pos.x = -pos.x;
            pos.y = -pos.y;
        }

        if (this._range) {
            pos.x = no.clamp(pos.x, this._range.xMin, this._range.xMax);
            pos.y = no.clamp(pos.y, this._range.yMin, this._range.yMax);
        }

        // 计算移动参数
        let p = this.node.position;
        if (!this.horizontal) {
            pos.x = p.x;
        }
        if (!this.vertical) {
            pos.y = p.y;
        }
        let dis = no.distance(p, pos); // 三维空间距离计算
        let duration = this.fixSpeed ? dis / this.speed : this.time; // 持续时间计算策略
        this.node.on(Node.EventType.TRANSFORM_CHANGED, this.onMoving, this);
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
        this.scheduleOnce(() => {
            this.node.off(Node.EventType.TRANSFORM_CHANGED, this.onMoving, this);
        }, duration);
    }

    private onMoving() {
        const { x, y } = this.node.position;
        no.EventHandlerInfo.execute(this.movingCall, x, y);
    }
}
