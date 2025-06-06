import { no } from '../../no';
import { ccclass, property, menu, Component, isValid, Node, macro } from '../../yj';

/**
 * Predefined variables
 * Name = YJSetChildrenShieldByY
 * DateTime = Fri Jan 14 2022 16:33:45 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetChildrenShieldByY.ts
 * FileBasenameNoExtension = YJSetChildrenShieldByY
 * URL = db://assets/Script/common/base/node/YJSetChildrenShieldByY.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * 设置子节点之间的遮挡关系，如果指定了目标节点，其他同级节点会根据目标节点进行遮挡关系设置
 * 
 */

@ccclass('YJSetChildrenShieldByY')
@menu('NoUi/node/YJSetChildrenShieldByY(设置子节点之间的遮挡关系)')
/**
 * 子节点层级自动排序组件（基于Y轴坐标）
 * @remarks
 * - 根据子节点Y轴坐标自动调整渲染层级
 * - Y值越大（位置越高）的节点显示在上层
 * - 适用于2D游戏中的层叠效果（如卡牌、角色遮挡等）
 * 
 * @example
 * // 编辑器配置示例：
 * 1. 添加到需要自动排序的容器节点
 * 2. 设置更新频率（默认每10帧更新一次）
 * 3. 运行时子节点Y坐标变化时会自动调整层级
 * 
 * // 代码动态创建示例：
 * const container = new Node('CardContainer');
 * container.addComponent(YJSetChildrenShieldByY).frameNum = 5; // 每5帧更新
 */
export class YJSetChildrenShieldByY extends Component {
    /** 
     * 更新频率控制（单位：帧） 
     * @tip 值越大性能消耗越小但响应越不及时，建议根据实际需求在10-30帧之间调整
     */
    @property({ displayName: '更新频率(帧)', tooltip: '每多少帧执行一次层级排序，60帧≈1秒' })
    frameNum: number = 10;

    /**
     * 执行子节点层级重排
     * @remarks
     * 实现逻辑：
     * 1. 收集所有激活状态的子节点
     * 2. 按Y轴坐标降序排列（Y值大的在上层）
     * 3. 设置子节点的兄弟索引（siblingIndex）实现正确遮挡
     * 
     * @example
     * // 手动触发重排（比如在动画结束后）：
     * this.getComponent(YJSetChildrenShieldByY)?.resort();
     */
    private resort() {
        if (!isValid(this?.node)) return;
        let children = this.node['_children'];
        if (children.length <= 1) return;
        no.sortArray(children, (b, a) => {
            return b.position.y - a.position.y;
        }, true);
    }

    private _num = 0;
    lateUpdate(dt: number): void {
        if (this._num == 0) {
            this.resort();
            this._num = this.frameNum;
        } else {
            this._num--;
        }
    }
}