
import { UITransform, v2, ccclass, menu, property, game, Vec2 } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { SetScrollToPercent } from './SetScrollToPercent';

/**
 * Predefined variables
 * Name = SetScrollToTarget
 * DateTime = Mon Jan 17 2022 14:16:25 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScrollToTarget.ts
 * FileBasenameNoExtension = SetScrollToTarget
 * URL = db://assets/Script/common/ui/SetScrollToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScrollToTarget')
@menu('NoUi/ui/SetScrollToTarget(设置scrollView滚动到目标:string)')
/**
 * 滚动到指定目标节点的增强组件
 * 功能说明：
 * - 支持通过目标管理器获取目标节点
 * - 提供两种滚动模式：直接滚动和受缩放影响的逐帧滚动
 * - 内置重试机制确保目标节点加载完成
 * 
 * @使用示例：
 * // 滚动到名为"boss"的目标节点（立即执行）
 * this.a_scrollToTarget("boss");
 * 
 * // 通过数据驱动方式滚动（带延迟）
 * this.a_setData("player");
 */
export class SetScrollToTarget extends SetScrollToPercent {
    /**
     * 最大尝试次数（用于等待目标节点加载）
     * @规则：
     * - 当目标节点未找到时，会进行多次尝试
     * - 建议值在50-200之间，避免无限循环
     * @example this.tryNum = 150; // 设置最大尝试150次
     */
    @property
    tryNum: number = 100;

    /**
     * 是否考虑content节点的缩放影响
     * @规则：
     * - true: 精确计算缩放后的位置（性能开销较大）
     * - false: 使用常规计算方式（默认）
     */
    @property({ tooltip: '受content节点缩放影响' })
    affectedByScale: boolean = false;

    // 当前已尝试次数
    private triedNum: number = 0;
    // 剩余滚动时间（用于逐帧滚动模式）
    private scrollTime: number;
    // 当前目标节点引用
    private _target: YJNodeTarget;

    /**
     * 数据变化处理入口
     * @param data 目标节点标识符
     * @示例 this.a_setData("enemy") // 滚动到敌人节点
     */
    protected onDataChange(data: any) {
        this.triedNum = 0;
        this.a_scrollToTarget(data);
    }

    /**
     * 公开的滚动方法
     * @param targetType 目标节点类型标识
     * @规则：
     * - 如果设置了等待时间(wait)，会延迟执行
     * - 自动处理目标节点加载等待
     * @示例 
     * // 立即滚动到宝箱节点
     * this.a_scrollToTarget("treasure");
     */
    public a_scrollToTarget(targetType: string) {
        if (this.scrollView == null) return;
        // 延迟执行逻辑
        if (this.wait > 0) {
            this.scheduleOnce(() => {
                this.startScroll(targetType);
            }, this.wait);
        } else {
            this.startScroll(targetType);
        }
    }

    /**
     * 开始滚动流程
     * @param targetType 目标节点类型标识
     * @实现说明：
     * 1. 从节点管理器获取目标
     * 2. 如果未找到且未达重试上限，延迟重试
     * 3. 根据缩放影响选择滚动模式
     */
    private startScroll(targetType: string) {
        // 从管理器获取目标节点
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        
        if (!target) {
            // 重试逻辑
            if (this.triedNum < this.tryNum) {
                this.triedNum++;
                this.scheduleOnce(() => {
                    this.startScroll(targetType);
                });
                return;
            }
            console.error('找不到target：', targetType);
            return;
        }

        this.triedNum = 0;
        // 选择滚动模式
        if (!this.affectedByScale) {
            this.scrollToTarget(target); // 常规模式
        } else {
            this.scrollToTargetByFrame(target); // 逐帧精确模式
        }
    }

    /**
     * 常规滚动到目标位置
     * @param target 目标节点引用
     */
    private scrollToTarget(target: YJNodeTarget) {
        this.scrollToOffset(this.getOffset(target), this.duration);
    }

    /**
     * 启动逐帧滚动模式
     * @param target 目标节点引用
     * @实现说明：
     * - 用于需要精确计算缩放影响的场景
     * - 通过requestAnimationFrame实现平滑滚动
     */
    private scrollToTargetByFrame(target: YJNodeTarget) {
        this.scrollTime = this.duration;
        this._target = target;
        this.requestAnimationFrameScroll();
    }

    /**
     * 计算目标节点在滚动视口中的偏移量
     * @param target 目标节点
     * @returns 计算后的偏移量
     * @实现步骤：
     * 1. 获取目标节点的世界坐标
     * 2. 转换为滚动容器的本地坐标
     * 3. 计算视口对齐偏移
     * 4. 处理滚动方向限制
     */
    private getOffset(target: YJNodeTarget): Vec2 {
        let pos = target.nodeWorldPosition;
        let ut = this.scrollView.content.getComponent(UITransform);
        let anchor = ut.anchorPoint;
        let size = ut.getBoundingBox().size;

        // 坐标转换计算
        ut.convertToNodeSpaceAR(pos, pos);
        pos.x += size.width * anchor.x;
        pos.y += size.height * (anchor.y - 1);

        // 视口尺寸获取
        let svSize = this.scrollView.node.getComponent(UITransform).contentSize;
        
        // 计算基础偏移
        let offset = v2(
            pos.x - svSize.width * this.at, 
            -pos.y - svSize.height * this.at
        );

        // 处理滚动方向限制
        if (!this.scrollView.vertical) offset.y = 0;
        if (!this.scrollView.horizontal) offset.x = 0;

        // 确保最小偏移值
        offset.x = Math.max(offset.x, 0);
        offset.y = Math.max(offset.y, 0);

        return offset;
    }

    /**
     * 逐帧滚动处理
     * @param dt 帧时间差（秒）
     * @实现说明：
     * - 每帧计算剩余滚动量
     * - 动态调整滚动速度
     */
    private scrollByFrame(dt: number) {
        if (!no.checkValid(this.node)) return;
        
        // 当前滚动偏移量
        let curOffset = this.scrollView.getScrollOffset();
        // 目标总偏移量
        let offset = this.getOffset(this._target);

        // 计算增量偏移
        offset.x += curOffset.x;
        offset.y -= curOffset.y;
        offset.multiplyScalar(Math.min(dt / this.scrollTime, 1));
        
        // 计算最终偏移
        offset.x -= curOffset.x;
        offset.y += curOffset.y;

        // 执行滚动
        this.scrollToOffset(offset);
        this.scrollTime -= dt;

        // 继续滚动直到时间耗尽
        if (this.scrollTime > 0) {
            this.requestAnimationFrameScroll();
        }
    }

    /**
     * 请求下一帧滚动
     * @实现说明：
     * - 使用游戏帧时间保证平滑性
     * - 自动处理组件销毁情况
     */
    private requestAnimationFrameScroll() {
        requestAnimationFrame(() => {
            // 使用游戏实际帧时间（秒）
            this?.scrollByFrame(game.frameTime * 0.001);
        });
    }
}
