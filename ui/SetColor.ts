
import { ccclass, menu, UIRenderer, property, LabelOutline, LabelShadow } from '../yj';
import { HackUi } from './HackUi';
import { rendererUtils } from './assemble/rendererUtils';

/**
 * Predefined variables
 * Name = SetColor
 * DateTime = Mon Jan 17 2022 10:35:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetColor.ts
 * FileBasenameNoExtension = SetColor
 * URL = db://assets/Script/NoUi3/ui/SetColor.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetColor')
@menu('NoUi/ui/SetColor(设置颜色:string|cc.Color)')
/**
 * 颜色设置组件
 * 
 * @功能说明
 * - 支持通过字符串或Color实例设置颜色
 * - 可同时处理普通UI元素颜色和文本描边颜色
 * - 自动适配不同类型的渲染组件：
 *   - 优先处理YJCharLabel自定义组件
 *   - 其次处理Cocos原生组件（LabelOutline/UIRenderer）
 * 
 * @使用示例
 * // 设置字体颜色为红色
 * a_setData("#ff0000"); 
 * a_setData(new Color(255,0,0));
 * 
 * // 设置描边颜色为蓝色
 * a_setData({ isOutline: true }); // 先切换模式
 * a_setData("#0000ff");
 */
export class SetColor extends HackUi {
    @property({ displayName: '设置文本描边' })
    isOutline: boolean = false;
    @property({ displayName: '设置文本阴影' })
    isShadow: boolean = false;

    private _comp: LabelOutline | UIRenderer | LabelShadow;

    protected onDataChange(data: any) {
        if (!this._comp) {
            let comp: LabelOutline | UIRenderer | LabelShadow;
            // 根据模式选择目标组件并应用颜色
            if (this.isOutline) {
                comp = this.getComponent(LabelOutline);
            } else if (this.isShadow) {
                comp = this.getComponent(LabelShadow);
            } else {
                comp = this.getComponent(UIRenderer);
            }
            this._comp = comp;
        }
        rendererUtils.color(this._comp, data);
    }
}
