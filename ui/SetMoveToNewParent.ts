import { YJNodeTarget } from 'NoUi3/base/node/YJNodeTarget';
import { no } from 'NoUi3/no';
import { EasingTypeName } from 'NoUi3/types';
import { ccclass, v3, Vec3 } from '../../NoUi3/yj';
import { SetMoveTweenToNodeTarget } from './SetMoveTweenToNodeTarget';
import { SetNodeTweenAction } from './SetNodeTweenAction';

/**
 * 
 * Author mqsy_yj
 * DateTime Sat Oct 12 2024 09:38:47 GMT+0800 (中国标准时间)
 * 将当前节点移动到目标节点下作为目标节点的子节点，缓动移动到目标位置
 */

@ccclass('SetMoveToNewParent')
/**
 * 将节点移动到新父节点并执行缓动动画的组件
 * @功能说明
 * - 将当前节点移动到目标父节点坐标系下
 * - 计算从当前位置到目标位置的缓动动画
 * - 支持固定速度或固定时间两种移动模式
 * @示例
 * // 将玩家血条移动到UI层：
 * // component.setTween('UI_Layer') 
 * // 血条会保持原世界坐标位置，缓动到UI层的指定位置
 * 
 * // 动态调整敌人归属到新编队：
 * // component.setTween('Team2_Node')
 * // 敌人会平滑移动到新编队节点的指定偏移位置
 */
export class SetMoveToNewParent extends SetMoveTweenToNodeTarget {

    /**
     * 设置节点缓动动画到目标父节点
     * @param targetType 目标节点类型标识符
     * @流程说明
     * 1. 获取目标父节点实例
     * 2. 若目标不存在则延迟重试
     * 3. 计算节点在目标父节点坐标系中的位置
     * 4. 设置节点父级关系
     * 5. 计算移动距离和持续时间
     * 6. 配置并启动缓动动画
     */
    protected setTween(targetType: string) {
        // 从节点目标管理器获取目标父节点
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        if (!target) {
            // 目标未加载时延迟重试（每帧检测直到目标可用）
            this.scheduleOnce(() => {
                this.setTween(targetType);
            });
            return;
        }

        // 计算节点当前世界坐标
        const pos = no.nodeWorldPosition(this.node);
        // 创建目标位置向量（基于配置的偏移量）
        const p = v3(this.offset.x, this.offset.y, 0);
        
        // 将世界坐标转换为目标父节点的本地坐标系
        no.worldPositionInNode(pos, target.node, pos);
        // 修改节点父级关系
        this.node.parent = target.node;
        // 设置节点在目标父节点中的初始位置
        no.position(this.node, pos);
        
        // 计算当前位置到目标位置的直线距离
        let dis = Vec3.distance(pos, p);
        // 根据移动模式计算持续时间：固定速度模式用距离/速度，固定时间模式用预设时间
        let duration = this.fixSpeed ? dis / this.speed : this.time;
        
        // 配置并启动缓动动画组件
        this.getComponent(SetNodeTweenAction).a_setData({
            duration: duration,    // 动画持续时间
            to: 1,                // 动画进度终点值（0->1）
            props: {              // 需要变化的属性
                pos: [p.x, p.y]   // 目标位置坐标
            },
            easing: EasingTypeName[this.easing] // 使用配置的缓动函数
        });
    }
}
