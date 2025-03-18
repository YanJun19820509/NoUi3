
import { ccclass, property, menu, EDITOR } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetDataWork
 * DateTime = Mon Jan 17 2022 10:45:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetDataWork.ts
 * FileBasenameNoExtension = SetDataWork
 * URL = db://assets/Script/NoUi3/ui/SetDataWork.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * 数据工作器设置组件
 * @description 将任意数据绑定到YJDataWork组件并进行初始化
 * @使用场景
 * 1. 在编辑器中将UI组件与数据处理器关联
 * 2. 运行时动态更新数据源并初始化
 * @示例
 * // 通过节点获取组件并设置数据
 * const worker = node.getComponent(SetDataWork);
 * worker.a_setData({ playerName: '张三', level: 30 });
 */
@ccclass('SetDataWork')
@menu('NoUi/ui/SetDataWork(将数据赋值给YJDataWork:any)')
export class SetDataWork extends HackUi {
    /**
     * 数据处理器组件
     * @description 负责数据解析和分发的核心组件
     * @提示 在编辑器中可拖拽节点上的YJDataWork组件到此属性
     */
    @property({ type: YJDataWork, tooltip: '数据处理器组件' })
    dataWork: YJDataWork = null;

    /**
     * 组件加载回调
     * @流程说明
     * 1. 执行父类初始化逻辑
     * 2. 编辑器环境下自动获取同节点的YJDataWork组件
     */
    onLoad() {
        super.onLoad();
        // 编辑器环境下自动关联组件
        if (EDITOR) {
            if (!this.dataWork) this.dataWork = this.getComponent(YJDataWork);
        }
    }

    /**
     * 数据变更处理
     * @param data 输入数据（支持任意格式）
     * @流程说明
     * 1. 检查数据处理器是否有效
     * 2. 更新数据源
     * 3. 初始化数据处理器
     * @示例
     * // 更新玩家数据
     * onDataChange({ name: '玩家1', hp: 100 });
     * 
     * // 更新配置数据
     * onDataChange(configData);
     */
    protected onDataChange(data: any) {
        if (this.dataWork) {
            // 设置新数据并初始化
            this.dataWork.data = data;
            this.dataWork.init();
        }
    }
}
