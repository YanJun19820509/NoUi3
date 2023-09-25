import { YJDataWork } from "../../base/YJDataWork";
import { no } from "../../no";
import { ccclass, property } from "../../yj";


/**
 * 数量加减控件
 * Author mqsy_yj
 * DateTime Wed Jul 26 2023 10:00:33 GMT+0800 (中国标准时间)
 * data:{max?:number,min?:number}
 */
@ccclass('YJQuantity')
export class YJQuantity extends YJDataWork {
    @property({ displayName: '加减1' })
    a1: boolean = true;
    @property({ displayName: '加减10' })
    a10: boolean = false;
    @property({ displayName: '最大最小' })
    amax: boolean = false;
    @property({ displayName: '显示最大数量' })
    isShowMax: boolean = true;
    @property({ displayName: '自定义', tooltip: '自定义数量将替换加减10' })
    isCustom: boolean = false;
    @property({ displayName: '自定义加减数量', visible() { return this.isCustom; } })
    customNum: number = 5;
    @property({ type: no.EventHandlerInfo })
    onChange: no.EventHandlerInfo[] = [];

    private _customNum: number;

    protected afterInit() {
        this._customNum = this.isCustom ? this.customNum : 10;
        const data = this.data || { num: 1, min: 1, max: 999999999 }
        this.data = {
            customNum: this._customNum,
            num: data.num,
            min: data.min,
            max: data.max,
            showMaxMin: this.amax,
            show1: this.a1,
            show10: this.a10
        };
    }
    /**此时data一定有值，子类按需实现该方法 */
    protected afterDataInit() {
        if (this.isShowMax) {
            this.setValue('maxNum', '/' + this.data.max);
        } else {
            this.setValue('maxNum', '');
        }
    }

    public a_add(e: any, type: string) {
        let v = 1;
        switch (type) {
            case '2'://加10
                v = this._customNum;
                break;
            case '3'://最大
                v = this.data.max;
                break;
        }
        this.setNum(v);
    }

    public a_minus(e: any, type: string) {
        let v = -1;
        switch (type) {
            case '2'://减10
                v = -this._customNum;
                break;
            case '3'://最小
                v = -this.data.num;
                break;
        }
        this.setNum(v);
    }

    private setNum(v: number) {
        const min = this.data.min,
            max = this.data.max,
            o = this.data.num;
        let num = o + v;
        if (num < min) num = min;
        if (num > max) num = max;
        if (num != o) {
            this.setValue('num', num);
            no.EventHandlerInfo.execute(this.onChange, num);
        }
    }
}