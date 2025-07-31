
import { ccclass, property, v3, Vec3, UITransform, isValid } from '../../yj';
import { YJNodeTarget } from '../../base/node/YJNodeTarget';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
import { nodeTargetManager } from '../../NodeTargetManager';

/**
 * Predefined variables
 * Name = YJBubble
 * DateTime = Tue Jun 14 2022 09:39:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJBubble.ts
 * FileBasenameNoExtension = YJBubble
 * URL = db://assets/common/widget/bubble/YJBubble.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 气泡控件,
 * data: {
 *     position?: number[x,y]
 *     target?: string//目标节点标识，在YJNodeTarget中设置，与position任选其一
 * }
 */
@ccclass('YJBubble')
export class YJBubble extends YJDataWork {
    /** 
     * 气泡相对于目标位置的偏移量 
     * @example [10, -5] 表示向右偏移10像素，向下偏移5像素
     * @example 可在数据中通过offset字段覆盖该值
     */
    @property(Vec3)
    offset: Vec3 = v3();

    /**
     * 数据初始化后处理位置计算
     * @description 位置计算逻辑：
     * 1. 优先使用数据中的position字段绝对坐标
     * 2. 其次使用target字段指定的目标节点世界坐标
     * 3. 将坐标转换为节点本地坐标系
     * 4. 应用偏移量后设置最终显示位置
     * @example 数据示例：
     * {
     *     position: [100, 200], // 绝对屏幕坐标
     *     target: "enemy",      // 或指定目标节点标识
     *     offset: [0, 30]       // 垂直向上偏移30像素
     * }
     */
    protected afterDataInit() {
        // 优先使用数据中的偏移量，否则使用组件默认值
        const offset = this.data.offset || this.offset;
        let pos = v3();
        
        // 位置计算策略
        if (this.data.position) { // 直接使用绝对坐标
            pos.x = this.data.position[0];
            pos.y = this.data.position[1];
        } else if (this.data.target) { // 通过目标节点获取世界坐标
            let nt = nodeTargetManager.get<YJNodeTarget>(this.data.target);
            if (!nt) return; // 目标节点不存在时中止
            
            let p = nt.nodeWorldPosition; // 获取目标节点世界坐标
            pos.x = p.x;
            pos.y = p.y;
        } else return; // 无有效定位信息时中止

        if (!isValid(this.node)) return;
        
        // 坐标系转换：将世界坐标转换为节点本地相对坐标
        this.node.getComponent(UITransform).convertToNodeSpaceAR(pos, pos);
        
        // 应用偏移量并更新显示位置
        this.setValue('pos', [pos.x + offset.x, pos.y + offset.y]);
        this.setValue('show', true); // 触发显示动画
    }

    /**
     * 隐藏气泡的动画方法
     * @description 通过设置show值为false触发隐藏动画
     * @example 
     * // 通过动画事件调用
     * this.getComponent(YJBubble).a_hide();
     */
    public a_hide(): void {
        this.setValue('show', false);
    }
}
