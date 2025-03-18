import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import { no } from '../no';
import { ccclass, property, menu, Node, isValid } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetNodesSwitch
 * DateTime = Mon Jan 17 2022 11:58:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetNodesSwitch.ts
 * FileBasenameNoExtension = SetNodesSwitch
 * URL = db://assets/Script/NoUi3/ui/SetNodesSwitch.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
@ccclass("SwitchInfo")
/**
 * 条件与节点显隐控制配置类
 * @example
 * // 在属性检查器中配置：
 * condition: "open,show" // 当收到"open"或"show"值时显示对应节点
 * nodes: [node1, node2]  // 需要控制的节点列表
 */
export class SwitchInfo {
    /**
     * 条件字符串，多个条件用逗号分隔
     * @example "open,close"
     */
    @property({ displayName: '条件', tooltip: '多条件用,分隔' })
    condition: string = '';

    /**
     * 需要控制的节点数组
     * @type {Node[]}
     */
    @property({ type: Node, displayName: '显示节点' })
    nodes: Node[] = [];

    // 处理后的条件数组（逗号分隔的字符串转换为数组）
    private conditions: string[];

    /**
     * 根据传入值检查是否需要显示节点
     * @param v 当前条件值
     */
    public checkShow(v: string) {
        // 初始化条件数组（只执行一次）
        if (!this.conditions) this.conditions = this.condition.split(',');
        
        // 判断当前值是否匹配条件
        const isMatch = this.conditions.indexOf(v) !== -1;
        
        // 遍历所有节点进行显隐控制
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            if (!isValid(node)) continue; // 跳过无效节点
            
            // 缓存原始X坐标（用于位移方式的显隐控制）
            if (node['__origin_x__'] == null) {
                node['__origin_x__'] = no.x(node);
            }
            
            // 通过激活状态控制显隐（替代直接设置位置的方式）
            no.visibleByActiveInHierarchy(node, isMatch);
            
            // 旧的位置控制方式保留但注释掉，方便需要时切换
            // no.x(node, !isMatch ? 20000 : node['__origin_x__']);
        }
    }

    /**
     * 初始化方法，默认隐藏所有节点
     * （通常在组件首次激活时调用）
     */
    public init() {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            no.visibleByActiveInHierarchy(node, false);
        }
    }
}
@ccclass('SetNodesSwitch')
@menu('NoUi/ui/SetNodesSwitch(设置显隐切换:string)')
/**
 * 显隐切换控制组件
 * @example
 * // 在属性面板配置示例：
 * // infos: [
 * //   { condition: "1,3,5", nodes: [node1, node2] },  // 值等于1/3/5时显示
 * //   { condition: "2,4,6", nodes: [node3, node4] }   // 值等于2/4/6时显示
 * // ]
 * // uiAnim: 指定一个渐入渐出动画组件（可选）
 */
export class SetNodesSwitch extends HackUi {

    // 切换配置数组（每个元素对应一组条件控制）
    @property(SwitchInfo)
    infos: SwitchInfo[] = [];

    // UI动画效果组件（配置后会在切换时播放动画）
    @property({ 
        displayName: '播放动效', 
        type: YJUIAnimationEffect, 
        tooltip: '没有指定则不播放动效，指定后会先播放动画再执行切换' 
    })
    uiAnim: YJUIAnimationEffect = null;

    // 当前存储的数据值
    private _data: string;

    /**
     * 数据变化回调处理
     * @param data 传入的新数据（自动转为字符串类型）
     * @example
     * // 当收到数据更新时：
     * // 1. 如果有动画配置且启用，先播放动画
     * // 2. 动画结束后通过回调执行实际切换
     * // 3. 没有动画则立即执行切换
     */
    protected onDataChange(data: any) {
        this._data = String(data);
        // 优先使用动画过渡方式
        if (this.uiAnim?.enabled) {
            this.uiAnim.a_play(); // 触发动画播放
        } else {
            this.check(); // 无动画立即执行检查
        }
    }

    /**
     * 动画效果回调接口（动画播放完成后触发实际切换）
     * 注意：该方法由动画组件自动调用，不要手动调用
     */
    public a_AnimationEffectCallback() {
        this.check();
    }

    /**
     * 执行实际的显隐检查
     * 使用传统for循环遍历保证最低环境兼容性
     */
    private check() {
        // 遍历所有配置信息（使用索引循环避免for...of迭代器）
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let info = this.infos[i];
            info.checkShow(this._data);
        }
    }
}
