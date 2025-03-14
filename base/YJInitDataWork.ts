
import { EDITOR, ccclass, property, requireComponent, executeInEditMode, Component, Node, Enum } from '../yj';
import { no } from '../no';
import { SimpleValueType } from '../types';
import { YJDataWork } from './YJDataWork';

/**
 * Predefined variables
 * Name = YJInitDataWork
 * DateTime = Tue Jan 10 2023 12:44:28 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJInitDataWork.ts
 * FileBasenameNoExtension = YJInitDataWork
 * URL = db://assets/NoUi3/base/YJInitDataWork.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */


/**
 * 数据初始化配置项
 * @description 定义需要初始化的数据项配置
 * @example
 * // 示例配置：
 * { key: 'playerName', type: SimpleValueType.String, value: '新手玩家' }
 * { key: 'isVIP', type: SimpleValueType.Boolean, value: 'true' }
 */
@ccclass('InitDataWorkInfo')
export class InitDataWorkInfo {
    /** 数据键名（对应YJDataWork中的数据字段） */
    @property
    key: string = '';
    /** 数据类型枚举 */
    @property({ type: Enum(SimpleValueType) })
    type: SimpleValueType = SimpleValueType.String;
    /** 字符串形式的数据值（根据类型自动转换） */
    @property
    value: string = '';
}

/**
 * 数据初始化组件
 * @description 用于在节点加载时自动初始化YJDataWork数据
 * @example 
 * // 编辑器配置示例：
 * // 1. 添加YJDataWork组件到节点
 * // 2. 添加本组件到同一节点
 * // 3. 在datas中配置需要初始化的数据项
 * 
 * @example
 * // 代码调用示例：
 * // 手动触发数据初始化
 * this.getComponent(YJInitDataWork).setData2DataWork();
 */
@ccclass('YJInitDataWork')
@executeInEditMode()
@requireComponent(YJDataWork)
export class YJInitDataWork extends Component {
    /** 关联的YJDataWork组件（自动从父节点获取） */
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;
    /** 初始化数据配置列表 */
    @property({ type: InitDataWorkInfo })
    datas: InitDataWorkInfo[] = [];
    /** 是否在加载时自动初始化数据 */
    @property
    autoSet: boolean = true;

    /**
     * 组件加载时处理
     * @description 编辑器模式下自动查找父节点数据组件，运行时自动初始化数据
     */
    onLoad() {
        if (EDITOR) {
            if (!this.dataWork)
                this.dataWork = no.getComponentInParents(this.node, YJDataWork);
            return;
        }
        this.autoSet && this.setData2DataWork();
    }

    /**
     * 执行数据初始化
     * @description 将配置数据转换为实际类型并设置到YJDataWork
     */
    private setData2DataWork() {
        let d: any = {};
        for (let i = 0; i < this.datas.length; i++) {
            const info = this.datas[i];
            if (info.key) {
                let v: any;
                switch (info.type) {
                    case SimpleValueType.Boolean:
                        v = info.value == 'true';
                        break;
                    case SimpleValueType.Number:
                        v = Number(info.value);
                        break;
                    case SimpleValueType.String:
                        v = info.value;
                        break;
                    case SimpleValueType.Array:
                    case SimpleValueType.Object:
                        v = no.parse2Json(info.value);
                        break;
                }
                d[info.key] = v;
            }
        }
        this.dataWork.data = d;
    }
}
