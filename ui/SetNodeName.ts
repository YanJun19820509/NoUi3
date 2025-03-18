
import { ccclass, menu } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetNodeName
 * DateTime = Mon Jan 17 2022 11:56:57 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetNodeName.ts
 * FileBasenameNoExtension = SetNodeName
 * URL = db://assets/Script/NoUi3/ui/SetNodeName.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetNodeName')
@menu('NoUi/ui/SetNodeName(设置节点名称:string)')
/**
 * 节点名称设置组件
 * @功能说明
 * - 通过数据绑定动态设置节点名称
 * - 支持任意类型数据转换为字符串形式
 * @使用示例
 * // 编辑器中使用：
 * // 1. 将本组件添加到需要控制名称的节点
 * // 2. 在数据源中设置需要显示的名称（如：YJDataWork.data = "PlayerName"）
 * 
 * // 代码控制：
 * // 获取组件后调用setData方法
 * // component.a_setData("enemy_001");
 */
@ccclass('SetNodeName')
@menu('NoUi/ui/SetNodeName(设置节点名称:string)')
export class SetNodeName extends HackUi {

    /**
     * 数据变更处理回调
     * @param data 输入数据（支持任意数据类型）
     * @流程说明
     * - 将输入数据转换为字符串类型
     * - 更新当前节点名称
     */
    protected onDataChange(data: any) {
        // 转换为字符串并更新节点名称
        // 注意：复杂对象会转换为[object Object]，建议传入字符串类型数据
        this.node.name = String(data);
    }
}
