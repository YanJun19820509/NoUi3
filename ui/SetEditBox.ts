
import { ccclass, requireComponent, menu, property, EDITOR, Node, EditBox } from '../yj';
import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { HackUi } from './HackUi';

/**
 * Predefined variables
 * Name = SetEditBox
 * DateTime = Mon Mar 28 2022 16:39:33 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetEditBox.ts
 * FileBasenameNoExtension = SetEditBox
 * URL = db://assets/NoUi3/ui/SetEditBox.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('SetEditBox')
@requireComponent(EditBox)
@menu('NoUi/ui/SetEditBox(设置输入框内容:string)')
/**
 * 输入框数据绑定组件
 * @description 实现EditBox与数据工作器的双向绑定，支持长度限制和数字类型验证
 * @使用场景
 * 1. 需要将输入框内容与数据模型绑定时
 * 2. 需要限制输入内容长度或类型时
 * @示例
 * // 在编辑器中使用：
 * 1. 拖拽带有YJDataWork组件的节点到dataWork属性
 * 2. 设置最大长度和类型验证规则
 * 
 * // 在代码中使用：
 * const editBoxComp = node.getComponent(SetEditBox);
 * editBoxComp.a_setData(100); // 初始化输入框内容
 */
export class SetEditBox extends HackUi {
    /** 关联的数据处理器组件（用于双向数据绑定） */
    @property({ type: YJDataWork })
    dataWork: YJDataWork = null;

    /** 是否强制转换为数字类型（启用后非数字输入将被过滤） */
    @property({ displayName: '是否是数字' })
    isNumber: boolean = false;

    /** 内部存储的最大字节长度 */
    @property({ serializable: true })
    _maxLen: number = 50;

    /**
     * 输入内容的最大字节长度（0表示不限制）
     * @example
     * // 设置最多输入10个字节（中文按2字节计算）
     * maxLen = 10;
     * chinese2 = true;
     */
    @property({ displayName: '字节最大长度', step: 1, min: 0 })
    public get maxLen(): number {
        return this._maxLen;
    }

    public set maxLen(v: number) {
        this._maxLen = v;
        this.getComponent(EditBox).maxLength = v;
    }

    /** 是否将中文按2个字节计算（仅当maxLen>0时生效） */
    @property({ displayName: '中文算2个字节长度', visible() { return this.maxLen > 0; } })
    chinese2: boolean = true;

    /** 绑定编辑结束事件（兼容旧版本属性） */
    @property
    public get bindEditiongDidEnded(): boolean {
        return false;
    }

    public set bindEditiongDidEnded(v: boolean) {
        this.getComponent(EditBox).textChanged = [no.createEventHandler(this.node, 'SetEditBox', 'onEditEnd')];
    }

    /**
     * 组件加载回调
     * @流程说明
     * 1. 执行父类初始化
     * 2. 编辑器环境下自动查找父节点的数据处理器
     * @示例
     * // 自动获取父节点的YJDataWork组件
     * node.addComponent(SetEditBox);
     */
    onLoad() {
        super.onLoad();
        if (EDITOR) {
            this.dataWork = no.getComponentInParents(this.node, YJDataWork);
            return;
        }
    }

    /**
     * 数据变更处理
     * @param data - 输入数据（支持字符串/数字/对象）
     * @流程说明
     * 1. 对象类型数据检查所有属性非空
     * 2. 转换为字符串显示在输入框
     * @示例
     * // 更新为数字
     * onDataChange(100); // 显示"100"
     * 
     * // 更新为对象（需所有属性非空）
     * onDataChange({name: "张三"}); // 显示"[object Object]"
     */
    protected onDataChange(data: any) {
        if (typeof data == 'object') {
            // 检查对象所有属性是否有效
            for (let k in data) {
                if (data[k] == null) return;
            }
        }
        this.getComponent(EditBox).string = String(data);
    }

    /**
     * 编辑结束事件处理
     * @param v - 输入框当前内容
     * @流程说明
     * 1. 应用长度限制规则
     * 2. 内容变化时延迟更新数据
     * 3. 同步到数据处理器
     * @示例
     * // 输入"测试test"（maxLen=8, chinese2=true）
     * // 截断为"测试te"（6字节）
     * onEditEnd("测试test");
     */
    private onEditEnd(v: string) {
        if (this.maxLen > 0) {
            // 应用字符串截断规则
            let v1 = no.cutString(v, this.maxLen, this.chinese2);
            if (v != v1) {
                v = v1;
                // 延迟更新保证界面刷新
                this.scheduleOnce(() => {
                    this.a_setData(JSON.stringify(v));
                });
            }
        }
        // 同步到数据处理器
        this.dataWork?.changeValueByUi(this.bind_keys, this.isNumber ? Number(v) : v);
    }
}
