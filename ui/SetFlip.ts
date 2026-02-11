
import { ccclass, property } from '../yj';
import { nodeUtils } from '../extend/nodeUtils';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetFlip
 * DateTime = Tue May 16 2023 09:27:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetFlip.ts
 * FileBasenameNoExtension = SetFlip
 * URL = db://assets/NoUi3/ui/SetFlip.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//上下、左右翻转
@ccclass('SetFlip')
/**
 * 节点翻转控制组件
 * @description 实现节点水平/垂直翻转功能，支持通过数据驱动触发
 * @使用场景
 * 1. 需要动态翻转UI元素方向时（如角色朝向切换）
 * 2. 需要保持原始缩放值进行镜像翻转时
 * @示例
 * // 在编辑器中：
 * 1. 勾选horizontal实现水平镜像
 * 2. 勾选vertical实现垂直翻转
 * 
 * // 在代码中：
 * const flipComp = node.getComponent(SetFlip);
 * flipComp.horizontal = true; // 启用水平翻转
 * flipComp.a_flip(); // 应用翻转效果
 */
export class SetFlip extends HackUi {
    /** 水平翻转标志（翻转X轴缩放） */
    @property({ displayName: '水平翻转' })
    horizontal: boolean = false;

    /** 垂直翻转标志（翻转Y轴缩放） */
    @property({ displayName: '垂直翻转' })
    vertical: boolean = false;

    /**
     * 数据变化响应方法
     * @param data 触发数据（本组件不需要特定数据格式）
     * @流程说明
     * 1. 接收到任意数据变化通知
     * 2. 执行翻转操作
     */
    protected onDataChange(data: any): void {
        this.a_flip();
    }

    /**
     * 执行翻转操作的核心方法
     * @实现原理
     * 1. 克隆当前节点的缩放值
     * 2. 根据标志位反转对应轴向的缩放值
     * 3. 应用新的缩放值
     * @注意 多次调用会产生翻转切换效果（如连续调用2次会恢复原状）
     * @示例
     * // 创建翻转动画：
     * for(let i=0; i<3; i++){
     *   setTimeout(()=>comp.a_flip(), i*500);
     * }
     */
    public a_flip() {
        nodeUtils.flip(this.node, this.horizontal, this.vertical);
    }
}
