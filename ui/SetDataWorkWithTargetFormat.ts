
import { ccclass, property } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetDataWorkWithTargetFormat
 * DateTime = Tue Feb 28 2023 10:41:59 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetDataWorkWithTargetFormat.ts
 * FileBasenameNoExtension = SetDataWorkWithTargetFormat
 * URL = db://assets/NoUi3/ui/SetDataWorkWithTargetFormat.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
@ccclass('DataMapInfo')
export class DataMapInfo {
    @property
    targetDataKey: string = '';
    @property
    inputDataValueKey: string = '';
}

//将数据转换成目标DataWork所需要的格式
@ccclass('SetDataWorkWithTargetFormat')
/**
 * 数据格式转换组件
 * @description 将输入数据转换为目标数据处理器所需的格式
 * @使用场景
 * 1. 当输入数据结构与目标组件要求格式不一致时
 * 2. 需要将多个来源的数据字段映射到目标数据结构时
 * @示例
 * // 配置数据映射规则：
 * dataMaps = [
 *   { targetDataKey: 'playerName', inputDataValueKey: 'userName' },
 *   { targetDataKey: 'level', inputDataValueKey: 'currentLevel' }
 * ]
 * 
 * // 输入数据 { userName: '张三', currentLevel: 30 }
 * // 转换后目标数据 { playerName: '张三', level: 30 }
 */
export class SetDataWorkWithTargetFormat extends HackUi {
    /**
     * 目标数据处理器组件
     * @description 接收转换后格式的数据组件
     * @提示 拖拽场景中带有YJDataWork组件的节点到此属性
     */
    @property(YJDataWork)
    targetDataWork: YJDataWork = null;

    /**
     * 数据字段映射配置数组
     * @description 定义输入数据字段到目标数据字段的映射关系
     * @结构说明
     * - targetDataKey: 目标数据结构中的字段名
     * - inputDataValueKey: 输入数据中的字段名
     * @示例配置
     * 将输入数据的'id'字段映射到目标数据的'userId'字段：
     * { targetDataKey: 'userId', inputDataValueKey: 'id' }
     */
    @property({ type: DataMapInfo, displayName: '数据映射' })
    dataMaps: DataMapInfo[] = [];

    /**
     * 数据变更处理核心方法
     * @param data 输入的原始数据（任意格式）
     * @流程说明
     * 1. 有效性检查：确认目标数据处理器存在
     * 2. 创建空数据容器
     * 3. 遍历所有映射规则进行数据转换
     * 4. 更新目标数据处理器并初始化
     * @注意 当输入数据中缺少配置的字段时，目标字段将被设为undefined
     */
    protected onDataChange(data: any) {
        // 检查目标数据处理器有效性
        if (this.targetDataWork) {
            // 创建目标数据容器
            const targetData = {};
            
            // 使用传统for循环遍历映射配置
            for (let i = 0; i < this.dataMaps.length; i++) {
                const map = this.dataMaps[i];
                // 执行字段映射：源数据字段 -> 目标数据字段
                targetData[map.targetDataKey] = data[map.inputDataValueKey];
            }
            
            // 更新目标数据处理器
            this.targetDataWork.data = targetData;
            // 初始化目标处理器（触发数据绑定更新）
            this.targetDataWork.init();
        }
    }
}
