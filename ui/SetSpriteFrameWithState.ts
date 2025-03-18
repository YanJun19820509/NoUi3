import { ccclass, property } from '../../NoUi3/yj';
import { no } from '../no';
import { SpriteFrameInfo } from '../types';
import { HackUi } from './HackUi';

/**
 * 根据状态设置不同的spriteframe
 * Author mqsy_yj
 * DateTime Wed Aug 23 2023 12:27:37 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetSpriteFrameWithStateInfo')
export class SetSpriteFrameWithStateInfo {
    /**
     * 条件匹配规则配置
     * @规则：
     * - 多个条件用英文逗号分隔
     * - 当传入值匹配任意条件时触发设置
     * @示例 
     * condition = "1,2" // 当状态值为"1"或"2"时生效
     */
    @property({ displayName: '条件', tooltip: '多条件用,分隔' })
    condition: string = '';

    /**
     * 关联的精灵帧配置信息
     * @功能说明：
     * - 包含精灵帧资源路径、名称等元数据
     * - 当条件匹配时使用该配置设置精灵
     * @示例 
     * spriteFrame = { assetName: "ui/icon/attack" } // 匹配时设置该图标
     */
    @property({ type: SpriteFrameInfo })
    spriteFrame: SpriteFrameInfo = new SpriteFrameInfo();

    // 缓存分割后的条件数组（优化性能）
    private conditions: string[];

    /**
     * 检查并执行条件匹配
     * @param v 当前状态值
     * @param comp 目标精灵设置组件（SetSpriteFrame或SetSpriteFrameInSampler2D）
     * @返回值说明：
     * - true: 条件匹配并执行设置
     * - false: 条件不匹配
     * @使用示例：
     * info.check("2", setSpriteComp); // 检查状态值是否为2
     */
    public check(v: string, comp: any): boolean {
        // 延迟初始化条件数组（只在首次调用时分割）
        if (!this.conditions) this.conditions = this.condition.split(',');

        // 使用数组索引检查代替includes保证严格模式兼容
        const matchFound = this.conditions.indexOf(v) !== -1;
        
        if (matchFound) {
            // 触发目标组件的精灵帧设置
            comp.setData(this.spriteFrame.assetName);
            return true;
        }
        return false;
    }
}

@ccclass('SetSpriteFrameWithState')
/**
 * 精灵帧状态控制组件
 * @功能说明：
 * - 根据传入的状态值匹配预配置的精灵帧
 * - 支持同时检测多个状态条件
 * - 自动适配SetSpriteFrame和SetSpriteFrameInSampler2D组件
 * 
 * @使用示例：
 * // 编辑器配置步骤：
 * // 1. 添加SetSpriteFrame或SetSpriteFrameInSampler2D组件
 * // 2. 添加本组件并配置stateInfos：
 * //    - condition: 状态条件（如"1,2"）
 * //    - spriteFrame: 对应要设置的精灵帧配置
 * // 3. 通过setData(2)触发状态切换
 */
export class SetSpriteFrameWithState extends HackUi {
    /**
     * 状态配置集合
     * @规则：
     * - 每个元素配置一个状态条件及对应精灵帧
     * - 按数组顺序检测，匹配到第一个符合条件的即停止
     * @示例 
     * // 编辑器配置示例：
     * stateInfos = [
     *   { condition: "1", spriteFrame: { assetName: "ui/icon/attack" } },
     *   { condition: "2,3", spriteFrame: { assetName: "ui/icon/defense" } }
     * ]
     */
    @property({ type: SetSpriteFrameWithStateInfo })
    stateInfos: SetSpriteFrameWithStateInfo[] = [];

    /**
     * 数据驱动更新方法
     * @实现逻辑：
     * 1. 获取目标精灵组件（优先SetSpriteFrameInSampler2D）
     * 2. 遍历所有状态配置进行条件匹配
     * 3. 首个匹配成功的配置将设置对应精灵帧
     * @参数说明：
     * @param data 状态值，支持类型：
     * - number: 直接转换为字符串匹配
     * - string: 原始字符串匹配
     * - boolean: 转换为"true"/"false"匹配
     * @示例 
     * this.a_setData(1)    // 匹配条件为"1"的配置
     * this.a_setData("3")  // 匹配条件包含"3"的配置
     */
    protected onDataChange(data: any) {
        // 获取目标精灵组件（优先采样器版本）
        const comp = this.getComponent('SetSpriteFrameInSampler2D') || this.getComponent('SetSpriteFrame');
        if (!comp) return;

        // 转换为字符串类型进行匹配
        const state = String(data);
        
        // 使用传统for循环遍历状态配置（保证严格模式兼容）
        for (let i = 0; i < this.stateInfos.length; i++) {
            // 当某个状态匹配成功时立即终止遍历
            if (this.stateInfos[i].check(state, comp)) break;
        }
    }
}
