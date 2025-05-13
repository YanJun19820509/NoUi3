
import { Vec3, ccclass, menu, property } from '../yj';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetScale
 * DateTime = Mon Jan 17 2022 14:00:49 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetScale.ts
 * FileBasenameNoExtension = SetScale
 * URL = db://assets/Script/common/ui/SetScale.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetScale')
@menu('NoUi/ui/SetScale(设置scale:number|[number])')
/**
 * 设置节点缩放 
 * 功能说明：
 * - 支持数字、数组等多种数据格式
 * - 提供乘法模式和直接设置模式
 * - 自动处理默认值和异常输入
 * 
 * 使用示例：
 * // 设置缩放为2倍
 * this.a_setData(2);
 * // 设置x轴2倍，y轴3倍，z轴保持原值
 * this.a_setData([2, 3]);
 * // 在原有基础上乘以2倍
 * this.a_setData(2) + isMultiply=true;
 */

export class SetScale extends HackUi {
    /**
     * 是否乘以节点原有缩放值（true: 新缩放值 = 原缩放值 * 输入值，false: 直接设置缩放值）
     * @example
     * // 当isMultiply=true时，传入2会使节点缩放变为原来2倍
     * // 当isMultiply=false时，传入2会直接设置节点缩放为(2,2,2)
     */
    @property({ tooltip: '乘以节点原有缩放' })
    isMultiply: boolean = false;

    // 记录节点原始缩放值
    private oldScale: Vec3 = null;

    /**
     * 数据变化处理函数
     * @param data 缩放值，支持三种格式：
     * - number: 统一设置xyz轴缩放
     * - [number]: 相当于[number, number, number]
     * - [x, y?, z?]: 分别设置各轴缩放，y和z可选（y默认取x值，z默认取1）
     * @example
     * // 设置缩放为2倍
     * updateData(2) 
     * // 设置x轴2倍，y轴3倍，z轴保持原值
     * updateData([2, 3]) 
     * // 在原有基础上乘以2倍
     * updateData(2) + isMultiply=true
     */
    protected onDataChange(data: any) {
        // 首次调用时保存原始缩放值
        if (!this.oldScale)
            this.oldScale = this.node.getScale();
        
        // 创建临时缩放对象用于计算
        let temp = this.oldScale.clone();

        // 处理数组类型输入（多轴单独设置）
        if (data instanceof Array) {
            // 解构数组参数并处理默认值
            const [x, y = data[0], z = 1] = data;
            
            if (this.isMultiply) {
                // 乘法模式：各轴分别相乘
                this.node.setScale(temp.multiply3f(x, y, z));
            } else {
                // 直接设置模式：使用提供的参数或默认值
                this.node.setScale(x, y, z);
            }
        }
        // 处理数字类型输入（统一缩放）
        else {
            if (this.isMultiply) {
                // 乘法模式：所有轴乘以相同系数
                this.node.setScale(temp.multiplyScalar(data));
            } else {
                // 直接设置模式：所有轴设为相同值
                this.node.setScale(data, data, data);
            }
        }
    }
}
