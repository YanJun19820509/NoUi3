
import { ccclass, property, menu, Component, Node } from '../yj';
import { SetHint } from '../ui/SetHint';
import { no } from '../no';

/**
 * Predefined variables
 * Name = YJHintWatcher
 * DateTime = Fri Jan 14 2022 18:02:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJHintWatcher.ts
 * FileBasenameNoExtension = YJHintWatcher
 * URL = db://assets/Script/common/base/YJHintWatcher.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('YJHintWatcher')
@menu('NoUi/base/YJHintWatcher(红点监听)')
/**
 * 红点系统监听组件
 * @description 用于监听多个红点状态并更新UI显示
 * @example 
 * // 编辑器配置示例：
 * // 1. 添加SetHint组件到节点
 * // 2. 将SetHint组件拖拽到hint属性
 * // 3. 填写需要监听的key（如: task,mail）
 * 
 * @example
 * // 代码调用示例：
 * // 动态修改监听key
 * this.getComponent(YJHintWatcher).setHintTypes('shop,achievement');
 */
export class YJHintWatcher extends Component {
    /** 关联的SetHint组件（用于显示红点状态） */
    @property({ type: SetHint })
    hint: SetHint = null;

    /** 需要监听的红点key列表（多个用逗号分隔） */
    @property({ displayName: '红点key', tooltip: '多个key用逗号分隔' })
    types: string = '';

    /** 分割后的红点key数组 */
    private typeList: string[] = [];

    /** 组件启用时自动绑定监听 */
    onEnable() {
        if (this.hint == null) return;
        this.bind();
    }

    /** 组件禁用时自动解除监听 */
    onDisable() {
        no.hintCenter.offHint(this);
    }

    /** 绑定红点监听 */
    private bind() {
        no.hintCenter.offHint(this);
        if (this.types == '') return;
        let types = this.types.split(',');
        this.typeList = types;
        for (let i = 0; i < types.length; i++) {
            this.bindHint(types[i]);
        }
    }

    /** 
     * 注册单个红点监听 
     * @param type 红点类型key
     */
    protected bindHint(type: string): void {
        no.hintCenter.onHint(type, this.setHint, this);
    }

    /** 
     * 红点状态更新回调 
     * @param v 红点数值状态
     */
    protected setHint(v: number): void {
        if (!this.hint) {
            no.hintCenter.offHint(this);
            return;
        }
        let n = 0;
        // 数值型红点：累加所有监听key的数值
        if (this.hint.isNumber) {
            for (let i = 0; i < this.typeList.length; i++) {
                n += no.hintCenter.getHintValue(this.typeList[i]); 
            }
        } 
        // 布尔型红点：任一key有值即显示
        else if (v < 1) {
            let len = this.typeList?.length || 0;
            for (let i = 0; i < len; i++) {
                let type = this.typeList[i];
                if (no.hintCenter.getHintValue(type) > 0) {
                    n = 1;
                    break;
                }
            }
        } else n = 1;
        this.hint.a_setData(String(n));
    }

    /**
     * 设置红点key
     * @param types 多个key用逗号分隔
     * @example
     * // 动态修改监听key
     * watcher.setHintTypes('task,daily,activity');
     */
    public setHintTypes(types: string) {
        this.types = types;
        this.bind();
    }
}
