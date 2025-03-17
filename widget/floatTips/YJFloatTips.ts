
import { ccclass, property, easing } from '../../yj';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
import { EasingTypeName } from 'NoUi3/types';

/**
 * Predefined variables
 * Name = YJFloatTips
 * DateTime = Tue Apr 19 2022 09:26:13 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJFloatTips.ts
 * FileBasenameNoExtension = YJFloatTips
 * URL = db://assets/NoUi3/widget/floatTips/YJFloatTips.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJFloatTips')
/**
 * 浮动提示组件，用于显示渐入渐出的文字提示
 * @example
 * // 在属性面板设置参数：
 * // delay: 0.2   // 提示间隔0.2秒
 * // upDuration: 0.6  // 上升动画0.6秒
 * // stayDuration: 1.2 // 停留1.2秒
 * // maxHeight: 150    // 最大上升高度150像素
 * 
 * // 代码调用示例：
 * // 显示单个提示
 * this.getComponent(YJFloatTips).setTips("获得金币+100"); 
 * // 显示多个连续提示
 * this.getComponent(YJFloatTips).setTips(["获得经验+50", "等级提升！"]);
 */
@ccclass('YJFloatTips')
export class YJFloatTips extends YJDataWork {
    /** 提示间隔时间（单位：秒），控制多个提示的显示间隔 */
    @property({ step: 0.1, min: 0.1, displayName: '间隔时长(s)' })
    delay: number = 0.1;
    /** 上升动画持续时间（单位：秒），控制文字从底部上升到中间的时间 */
    @property({ step: 0.1, min: 0.1, displayName: '上升时长(s)' })
    upDuration: number = 0.5;
    /** 停留持续时间（单位：秒），控制文字在中间位置的停留时间 */
    @property({ step: 0.1, min: 0.1, displayName: '停留时长(s)' })
    stayDuration: number = 1;
    /** 最大上升高度（单位：像素），控制文字最终消失的位置 */
    @property({ step: 1, min: 1 })
    maxHeight: number = 100;

    private tipList: string[] = []; // 待显示提示队列
    private isShowing: boolean = false; // 是否正在显示提示

    /**
     * 添加提示到显示队列
     * @param tips 要显示的提示内容，可以是单个字符串或字符串数组
     * @example
     * // 添加单个提示
     * setTips("生命值已恢复");
     * // 添加多个提示
     * setTips(["获得金币×100", "解锁新成就"]);
     */
    public setTips(tips: string | string[]): void {
        this.tipList = this.tipList.concat(tips);
        if (this.isShowing) return;
        this.show();
    }

    /**
     * 执行提示显示流程
     * @description 显示逻辑：
     * 1. 检查节点是否激活
     * 2. 从队列取出第一个提示
     * 3. 配置三阶段动画：
     *    - 初始位置设置（底部）
     *    - 上升动画（到中间位置）
     *    - 继续上升并淡出（到顶部消失）
     * 4. 调度下一个提示显示
     */
    private show() {
        if (!this.enabledInHierarchy) return;
        this.isShowing = true;
        let tip = this.tipList.shift();
        if (!tip) {
            this.isShowing = false;
            return;
        }

        // 配置动画参数
        this.setValue('tip', {
            txt: tip, // 提示文本内容
            move: [
                // 初始状态：底部位置，完全不透明
                {
                    set: 1, // 立即设置属性
                    props: {
                        pos: [0, 0, 0],    // 起始位置（x,y,z）
                        opacity: 255       // 完全不透明
                    }
                },
                // 上升阶段：持续upDuration秒上升到中间位置
                {
                    to: 1, // 过渡到目标值
                    duration: this.upDuration,
                    props: {
                        pos: [0, this.maxHeight - 50, 0] // 中间位置
                    }
                },
                // 停留并淡出阶段：持续stayDuration秒上升到顶部并透明
                {
                    to: 1,
                    duration: this.stayDuration,
                    props: {
                        pos: [0, this.maxHeight, 0], // 最终高度
                        opacity: 0                   // 完全透明
                    },
                    easing: EasingTypeName.BackIn // 使用回弹缓动效果
                }
            ]
        });

        // 队列处理
        if (this.tipList.length == 0) {
            this.isShowing = false;
            return;
        }
        // 调度下一个提示显示
        this.scheduleOnce(() => {
            this.show();
        }, this.delay);
    }
}
