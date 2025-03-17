
import { ccclass, property, Component, Node } from '../../yj';
import { no } from '../../no';

/**
 * Predefined variables
 * Name = YJGoToTarget
 * DateTime = Fri Jun 24 2022 12:10:39 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJGoToTarget.ts
 * FileBasenameNoExtension = YJGoToTarget
 * URL = db://assets/NoUi3/base/goto/YJGoToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJGoToTarget')
/**
 * 跳转目标组件，用于处理界面跳转后的回调事件
 * @核心功能
 * - 提供延时触发机制
 * - 支持多回调事件配置
 * - 与YJGoToManager协同完成跳转流程
 */
export class YJGoToTarget extends Component {
    /** 
     * 回调事件列表
     * @编辑器操作
     * 1. 点击"+"号添加新回调
     * 2. 拖拽目标节点到Target属性
     * 3. 选择组件及处理方法
     * @参数传递
     * - 通过trigger方法的args参数传递
     * - 支持对象解构赋值
     */
    @property(no.EventHandlerInfo)
    cbs: no.EventHandlerInfo[] = [];

    /** 
     * 延时执行时间(秒)
     * @使用场景
     * - 等待界面加载动画完成
     * - 防止连续点击误操作
     * @示例
     * - 0.5: 半秒后执行
     * - 2: 两秒后执行
     */
    @property({ displayName: '延时执行(s)', min: 0 })
    delay: number = 0;

    /**
     * 触发目标事件
     * @param args 事件参数（支持任意类型数据传递）
     * @参数结构示例
     * {
     *   from: 'HomeScene',    // 来源界面
     *   data: { itemId: 123 },// 业务数据
     *   callback: () => {}    // 完成回调
     * }
     * @执行流程
     * 1. 根据delay值创建延时调度
     * 2. 使用scheduleOnce保证线程安全
     * 3. 遍历执行所有回调事件
     * @调用示例
     * // 在跳转完成后触发
     * getComponent(YJGoToTarget).trigger({
     *   success: true,
     *   payload: res.data
     * });
     */
    public trigger(args: any): void {
        this.scheduleOnce(() => {
            no.EventHandlerInfo.execute(this.cbs, args);
        }, this.delay);
    }
}
