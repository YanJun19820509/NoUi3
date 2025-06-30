
import { ccclass, property, menu, Component, Node, Label } from '../yj';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { HackUi } from './HackUi';
import { no } from '../no';

/**
 * Predefined variables
 * Name = SetHint
 * DateTime = Fri Jan 14 2022 18:03:32 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetHint.ts
 * FileBasenameNoExtension = SetHint
 * URL = db://assets/Script/common/ui/SetHint.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetHint')
@menu('NoUi/ui/SetHint(设置红点:number)')
/**
 * 红点提示组件（支持数字显示）
 * 
 * 功能说明：
 * 1. 可控制目标节点的显隐状态作为红点提示
 * 2. 支持显示具体数字（普通Label或字符动画Label）
 * 3. 支持设置默认显示状态
 * 
 * 使用示例：
 * @example 
 * // 在Cocos编辑器中：
 * // 1. 将目标节点拖拽到targetNode属性
 * // 2. 勾选isNumber启用数字显示
 * // 3. 绑定Label或CharLabel组件
 */
export class SetHint extends HackUi {

    @property({ displayName: '红点', type: Node, tooltip: '需要显示红点的目标节点，默认为当前节点' })
    targetNode: Node = null;

    @property({ tooltip: '是否显示数字数量' })
    isNumber: boolean = true;

    @property({
        type: Label,
        displayName: '显示红点数量',
        visible() { return this.isNumber; },
        tooltip: '用于显示数字的Label组件（isNumber为true时生效）'
    })
    label: Label = null;

    @property({
        type: YJCharLabel,
        displayName: '显示红点数量',
        visible() { return this.isNumber; },
        tooltip: '用于显示数字动画的CharLabel组件（isNumber为true时生效）'
    })
    charLabel: YJCharLabel = null;

    @property({ displayName: '默认显示', tooltip: '初始化时的默认显示状态' })
    public get defaultShow(): boolean {
        return this._defaultShow;
    }

    public set defaultShow(v: boolean) {
        if (v == this._defaultShow) return;
        this._defaultShow = v;
        no.visible(this.targetNode, v);
    }

    @property({ serializable: true })
    _defaultShow: boolean = true;

    /** 组件加载时初始化 */
    onLoad() {
        super.onLoad();
        // 默认使用当前节点作为目标节点
        this.targetNode = this.targetNode || this.node;
        // 初始化显示状态
        if (this.bind_keys && !this.dataSetted) {
            no.visible(this.targetNode, this._defaultShow);
        }
    }

    /**
     * 数据变更处理
     * @param data 红点数量数据（支持数字或可转换为数字的字符串）
     * 
     * @example
     * // 当收到数据0时隐藏红点
     * // 当收到数据>0时显示红点，并更新数字显示
     */
    protected onDataChange(data: any) {
        let v = Number(data);
        // 控制红点显隐
        no.visible(this.targetNode, v > 0);

        // 更新数字显示
        if (this.isNumber) {
            const strData = String(data);
            if (this.label != null)
                this.label.string = strData;
            if (this.charLabel != null)
                this.charLabel.string = strData;
        }
    }
}
