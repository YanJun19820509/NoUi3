import { ccclass, requireComponent } from '../../NoUi3/yj';
import { HackUi } from './HackUi';
import { SetMultipleList } from './SetMultipleList';

/**
 * 
 * Author mqsy_yj
 * DateTime Thu Mar 21 2024 11:13:16 GMT+0800 (中国标准时间)
 * 仅用于当SetMultipleList数据内某条数据修改且不需要刷新整个列表时
 */

@ccclass('SetMultipleListUpdateData')
@requireComponent(SetMultipleList)
/**
 * 列表数据局部更新组件
 * @功能说明
 * - 专用于优化SetMultipleList的局部数据更新
 * - 当列表某条数据修改时避免全列表刷新
 * - 继承自HackUi实现特殊UI更新逻辑
 * @使用场景
 * - 聊天记录单个消息状态更新
 * - 表格中某行数据字段修改
 * - 长列表中图片/视频的懒加载
 * @示例
 * // 更新索引为5的数据项：
 * const data = component.listData; // 获取当前列表数据副本
 * data[5].status = '已读';         // 修改特定数据
 * component.updateData(data);      // 提交修改（不会触发全列表刷新）
 */
export class SetMultipleListUpdateData extends HackUi {

    /**
     * 数据变更处理方法（覆盖父类方法）
     * @param data 新数据集（格式需与原始数据保持一致）
     * @结构说明
     * - 数据格式应为数组，元素需包含模板类型标识
     * - 通过浅拷贝更新实现高效局部刷新
     * @工作流程
     * 1. 接收新数据集（通常为修改后的原列表数据）
     * 2. 调用SetMultipleList的updateData方法
     * 3. 触发列表的差异更新（仅修改变化的元素）
     * @示例
     * // 修改并更新单个元素：
     * const newData = [...originalData]; // 浅拷贝原数据
     * newData[2].price *= 0.8;          // 修改索引2的价格
     * this.onDataChange(newData);       // 触发局部更新
     */
    protected onDataChange(data: any) {
        // 通过SetMultipleList组件执行优化后的数据更新
        // 注意：这里直接使用原数据引用，依赖SetMultipleList的差异对比逻辑
        this.getComponent(SetMultipleList).updateData(data);
    }
}
