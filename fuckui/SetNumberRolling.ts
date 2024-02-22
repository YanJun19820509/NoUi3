import { Label, RichText, ccclass, isValid, property } from '../../NoUi3/yj';
import { no } from '../no';
import { YJCharLabel } from '../widget/charLabel/YJCharLabel';
import { FuckUi } from './FuckUi';

/**
 * 数字滚动效果
 * Author mqsy_yj
 * DateTime Tue Oct 10 2023 14:54:12 GMT+0800 (中国标准时间)
 * data:{from:number,to:number, format:string}
 */

@ccclass('SetNumberRolling')
export class SetNumberRolling extends FuckUi {
    @property({ displayName: '时长s', min: 0 })
    duration: number = 1;
    @property({ displayName: '次数', min: 0 })
    num: number = 1;
    @property({ displayName: '保留小数位', min: 0, step: 1 })
    decimal: number = 0;
    @property({ displayName: '格式化模板' })
    formatter: string = '{0}';
    @property({ type: no.EventHandlerInfo })
    onEnd: no.EventHandlerInfo[] = [];

    protected label: Label | RichText | YJCharLabel;

    protected onDataChange(data: any) {
        if (data.format) this.formatter = data.format;
        this.rolling(data);
    }

    private rolling(data: any) {
        const from = data.from,
            to = data.to,
            add = no.float((to - from) / this.num, this.decimal);
        this.setLabel(from);
        if (from == to) return;
        let v = from;
        no.schedule(() => {
            v += add;
            this.setLabel(no.floor(v));
        }, this.duration / this.num, this.num, 0, this, () => {
            this.setLabel(to);
        });
    }

    private setLabel(v: number) {
        if (!isValid(this.node)) return;
        if (!this.label) {
            this.label = this.node.getComponent(Label) || this.node.getComponent(RichText) || this.node.getComponent(YJCharLabel);
        }
        this.label.string = no.formatString(this.formatter, { '0': v });;
    }

    /**如果没需求可以不实现 */
    // public a_setEmpty(): void {

    // }
}
