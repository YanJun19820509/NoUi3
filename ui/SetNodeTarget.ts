

import { ccclass, property, requireComponent } from '../yj';
import { YJNodeTarget } from '../base/node/YJNodeTarget';
import { HackUi } from './HackUi';
import { no } from '../no';

/**
 * Predefined variables
 * Name = setNodeTarget
 * DateTime = Tue Jun 14 2022 10:34:56 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = setNodeTarget.ts
 * FileBasenameNoExtension = setNodeTarget
 * URL = db://assets/NoUi3/ui/setNodeTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetNodeTarget')
@requireComponent(YJNodeTarget)
/**
 * 设置节点目标的UI组件
 * @example
 * // 当data为字符串时（格式：用|分隔的值）
 * data = "a|b"; formatter = "{0}-{1}" => 结果"a-b"
 * 
 * // 当data为数字时
 * data = 5; formatter = "{0}kg" => 结果"5kg"
 * 
 * // 当data为对象时
 * data = {name: "test"}; formatter = "名称:{name}" => 结果"名称:test"
 */
export class SetNodeTarget extends HackUi {

    /**
     * 格式化字符串模板，使用{0}、{1}等占位符
     * @example
     * - 模板 "{0}%"{...} 会替换为具体数值百分比
     * - 模板 "LV:{level}" 需要传入包含level属性的对象
     */
    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';

    /**
     * 数据变化处理函数
     * @param data 输入数据，支持三种格式：
     * - 字符串：用|分隔的多个值（如"100|200"）
     * - 数字：直接作为第一个参数
     * - 对象：包含模板所需键值对的对象
     */
    protected onDataChange(data: any) {
        let s = '';
        // 处理字符串类型数据（支持多个参数）
        if (typeof data == 'string') {
            if (data != '')
                s = no.formatString(this.formatter, data.split('|'));
        } 
        // 处理数字类型数据（转换为包含0属性的对象）
        else if (typeof data == 'number') {
            s = no.formatString(this.formatter, { '0': data });
        } 
        // 处理对象类型数据（直接使用对象属性）
        else {
            s = no.formatString(this.formatter, data);
        }
        // 将格式化后的字符串设置到目标组件
        this.getComponent(YJNodeTarget).setType(s);
    }
}
