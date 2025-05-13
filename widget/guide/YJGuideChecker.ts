
import { ccclass, property, Component, CCString } from '../../yj';
import { YJGuideManager } from './YJGuideManager';

/**
 * Predefined variables
 * Name = YJGuideChecker
 * DateTime = Mon May 16 2022 09:22:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGuideChecker.ts
 * FileBasenameNoExtension = YJGuideChecker
 * URL = db://assets/common/widget/guide/YJGuideChecker.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJGuideChecker')
/**
 * 新手引导条件检查组件
 * @example
 * // 在属性面板配置示例：
 * // steps: ['guide_step1', 'shop_guide'] 需要按顺序检查的引导步骤标识
 * // autoCheckonEnable: true 启用时自动检查
 * 
 * // 代码调用示例：
 * // 手动触发引导检查
 * this.getComponent(YJGuideChecker).a_check();
 */
export class YJGuideChecker extends Component {
    /** 
     * 需要检查的引导步骤标识数组 
     * @description 按数组顺序检查，当检测到任意步骤需要触发引导时即停止后续检查
     * @example ['step1_start', 'step2_combat'] 表示依次检查这两个引导步骤
     */
    @property({ type: CCString })
    steps: string[] = [];

    /** 
     * 是否在组件启用时自动执行检查 
     * @description 设置为true时，当节点激活/组件启用时自动调用检查逻辑
     */
    @property
    autoCheckonEnable: boolean = true;

    /**
     * 组件启用时回调
     * @description 当autoCheckonEnable为true时，自动执行引导检查
     */
    onEnable() {
        this.autoCheckonEnable && this.a_check();
    }

    /**
     * 执行引导条件检查
     * @description 遍历steps数组，按顺序检查每个引导步骤是否需要触发
     * 当发现某个步骤需要触发引导时，立即停止后续检查
     * @example
     * // 在按钮点击事件中手动检查
     * onClick() {
     *     this.getComponent(YJGuideChecker).a_check();
     * }
     */
    public a_check(): void {
        for (let i = 0, n = this.steps.length; i < n; i++) {
            // 使用引导管理器检查步骤是否需要触发
            if (YJGuideManager.ins.check(this.steps[i])) {
                // 当某个步骤需要触发时，立即终止后续检查
                return;
            }
        }
    }
}
