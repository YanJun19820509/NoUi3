
import { ccclass, property, menu, Component, Node } from '../yj';
import { HackUi } from '../ui/HackUi';

/**
 * Predefined variables
 * Name = YJSetJson2UiData
 * DateTime = Fri Jan 14 2022 18:09:09 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetJson2UiData.ts
 * FileBasenameNoExtension = YJSetJson2UiData
 * URL = db://assets/Script/NoUi3/base/YJSetJson2UiData.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

/**
 * JSON转UI数据配置项
 * @description 定义JSON字符串与UI组件的对应关系
 * @example
 * // 编辑器配置示例：
 * 1. 在json字段填写JSON字符串（支持多行）
 * 2. 将FuckUi组件节点拖入ui属性
 * 3. 点击测试按钮验证数据转换
 */
@ccclass('Json2UiDataInfo')
export class Json2UiDataInfo {
    /** 原始JSON字符串（支持多行输入，自动处理换行符和引号转义） */
    @property({ multiline: true })
    json: string = '';
    /** 目标FuckUi组件（需要数据绑定的UI组件） */
    @property(HackUi)
    ui: HackUi = null;

    /**
     * 执行数据设置
     * @description 将处理后的JSON数据传递给UI组件
     * 自动执行以下处理：
     * 1. 移除所有换行符
     * 2. 转换单引号为双引号
     * 3. 验证UI组件有效性
     */
    public setData() {
        if (this.json == '' || !this.ui) return;
        this.ui.a_setData(this.json.replace(/\n/g, '').replace(/\'/g, '\"'));
    }
}

/**
 * JSON转UI数据组件
 * @description 提供以下功能：
 * 1. 将多行JSON字符串转换为标准JSON格式
 * 2. 自动/手动向UI组件注入数据
 * 3. 支持多个配置项批量处理
 * 
 * @example
 * // 编辑器使用：
 * 1. 添加本组件到节点
 * 2. 在infos中配置多个Json2UiDataInfo
 * 3. 勾选autoSet自动执行 或 通过a_set方法手动触发
 * 
 * @example
 * // 代码调用示例：
 * // 获取组件实例
 * const converter = this.node.getComponent(YJSetJson2UiData);
 * // 手动触发第一个配置项的数据设置
 * converter.a_set(0);
 * // 通过事件系统触发指定索引的配置
 * converter.a_set('eventName', 1);
 */
@ccclass('YJSetJson2UiData')
@menu('NoUi/base/YJSetJson2UiData(json转ui data:string)')
export class YJSetJson2UiData extends Component {
    /** 数据转换配置列表（支持多个JSON到UI的映射配置） */
    @property(Json2UiDataInfo)
    infos: Json2UiDataInfo[] = [];
    /** 是否在组件启动时自动执行数据设置 */
    @property
    autoSet: boolean = true;

    start() {
        if (!this.autoSet) return;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            this.infos[i].setData();
        }
    }

    /**
     * 手动触发数据设置
     * @param event 事件对象或配置项索引
     * @param idx 可选参数，当第一个参数为事件对象时使用的配置索引
     * @example
     * // 触发第0个配置项：a_set(0)
     * // 通过事件触发第1个配置项：a_set(event, 1)
     */
    public a_set(event: any, idx?: string | number) {
        let info = this.infos[Number(idx || event)];
        info?.setData();
    }
}