
import { ccclass, property, Component, Node, UITransform, math, Vec2 } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { no } from '../no';
import { SetPosition } from './SetPosition';

/**
 * Predefined variables
 * Name = SetPositionToNodeTarget
 * DateTime = Tue Jun 28 2022 18:45:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPositionToNodeTarget.ts
 * FileBasenameNoExtension = SetPositionToNodeTarget
 * URL = db://assets/NoUi3/ui/SetPositionToNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetPositionToNodeTarget')
/**
 * 将节点坐标设置为指定目标节点的世界坐标
 * 功能说明：
 * - 通过目标节点类型标识符获取目标节点引用
 * - 将目标节点的世界坐标转换为父节点本地坐标系
 * - 应用偏移量后调用父类方法设置最终位置
 * 
 * 使用示例：
 * // 设置目标为"player"类型的节点
 * this.a_setData('player');
 */
export class SetPositionToNodeTarget extends SetPosition {
    /**
     * 坐标偏移量
     * @property {Vec2} offset
     * @default Vec2.ZERO
     * @example
     * // 设置X轴偏移50，Y轴偏移100
     * this.offset = new Vec2(50, 100);
     */
    @property
    offset: Vec2 = math.v2();

    /**
     * 数据变化处理入口
     * @param data 目标节点类型标识符（字符串类型）
     * @example 
     * // 设置目标为"player"类型的节点
     * this.node.emit('data', 'player');
     * // 设置目标为"enemy"类型的节点
     * this.node.emit('data', 'enemy');
     */
    protected onDataChange(data: any) {
        this.setPosition(data);
    }

    /**
     * 设置节点到目标位置
     * @param targetType 目标节点类型标识符
     * @实现流程:
     * 1. 从节点目标管理器获取目标节点引用
     * 2. 如果目标不存在，延迟一帧后重试（解决时序问题）
     * 3. 获取目标节点的世界坐标
     * 4. 将世界坐标转换为本地相对坐标
     * 5. 应用偏移量后调用父类方法设置最终位置
     * @example
     * // 当目标节点尚未加载时，会自动重试直到找到目标
     * this.setPosition('npc_01');
     */
    private setPosition(targetType: string) {
        // 从管理器获取目标节点引用
        let target = no.nodeTargetManager.get<YJNodeTarget>(targetType);
        
        // 目标不存在时的重试机制
        if (!target) {
            // 使用scheduleOnce实现单次延迟重试（避免死循环）
            this.scheduleOnce(() => {
                this.setPosition(targetType);
            });
            return;
        }

        // 获取目标节点的世界坐标
        let pos = target.nodeWorldPosition;
        // 将世界坐标转换为父节点本地坐标系
        this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        
        // 应用偏移量并调用父类方法设置坐标
        // 使用数组形式传递坐标参数：[x + offsetX, y + offsetY]
        super.onDataChange([pos.x + this.offset.x, pos.y + this.offset.y]);
    }
}
