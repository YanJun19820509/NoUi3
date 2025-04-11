
import { ccclass, menu } from '../yj';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetPosition
 * DateTime = Mon Jan 17 2022 12:08:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPosition.ts
 * FileBasenameNoExtension = SetPosition
 * URL = db://assets/Script/NoUi3/ui/SetPosition.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPosition')
@menu('NoUi/ui/SetPosition(设置坐标:object|array)')
export class SetPosition extends HackUi {

    /**
     * 坐标设置数据处理器
     * @param data 支持的输入格式：
     * - 对象形式：需包含x/y属性，如{x:100,y:200}
     * - 数组形式：至少包含两个数字元素，如[100,200]
     * @实现逻辑：
     * 1. 将输入数据转换为数组形式
     * 2. 取前两个有效值作为坐标参数
     * 3. 使用no工具类设置节点坐标
     * @使用示例：
     * // 通过对象设置坐标
     * this.a_setData({x: 100, y: 200});
     * // 通过数组设置坐标
     * this.a_setData([150, 300]);
     * // 混合格式处理（自动取前两个有效值）
     * this.a_setData({a: 50, b: 75}); // 会转换为[50,75]
     */
    protected onDataChange(data: any) {
        // 将输入数据转换为数组形式
        const a: number[] = [];
        // 使用传统for循环遍历对象属性（兼容各种数据结构）
        for (const key in data) {
            // 按属性遍历顺序收集数值（注意：对象属性顺序可能不固定）
            a[a.length] = Number(data[key]);
        }

        // 设置节点坐标（自动处理undefined/NaN等异常值）
        // no.x/no.y内部已包含数值安全处理逻辑
        no.x(this.node, a[0]); // 设置X坐标（数组第一个元素）
        no.y(this.node, a[1]); // 设置Y坐标（数组第二个元素）
    }
}
