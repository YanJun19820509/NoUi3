
import { ccclass, property, menu, PageView } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetPageCurrentShow
 * DateTime = Mon Jan 17 2022 12:01:36 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPageCurrentShow.ts
 * FileBasenameNoExtension = SetPageCurrentShow
 * URL = db://assets/Script/NoUi3/ui/SetPageCurrentShow.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPageCurrentShow')
@menu('NoUi/ui/SetPageCurrentShow(设置当前显示的页面:number)')
export class SetPageCurrentShow extends HackUi {

    /**
     * 分页视图组件引用
     * @rule 必须关联场景中的PageView组件
     * @example 
     * // 在属性检查器中拖拽PageView节点到该属性字段
     */
    @property(PageView)
    pageView: PageView = null;

    /**
     * 分页切换数据处理器
     * @param data 支持的输入格式：
     * - 数字类型：直接作为页码（从0开始）
     * - 字符串类型：可转换为数字的页码
     * - 其他类型：会尝试转换为数字，失败则使用0
     * @example 
     * // 切换到第2页（索引为1）
     * this.node.emit('data', 1);
     * // 通过字符串切换
     * this.node.emit('data', "2"); // 切换到第3页
     * // 无效值处理
     * this.node.emit('data', "invalid"); // 会转换为0，切换到第1页
     */
    protected onDataChange(data: any) {
        // 安全转换数据类型并设置当前页
        // 使用Number强制转换保证数值类型安全
        // 空值保护（可选链操作符?.）
        this.pageView?.setCurrentPageIndex(Number(data));
    }
}
