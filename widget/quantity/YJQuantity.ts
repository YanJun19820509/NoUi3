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
/**
 * 数量加减控件
 * 支持多种增减方式：±1、±10、最大/最小、自定义步长
 * @example
 * // 编辑器配置示例：
 * // 1. 挂载组件到节点
 * // 2. 配置操作按钮（需自行实现按钮事件绑定）：
 * //    - 加1按钮：a_add(null, '1')
 * //    - 加10按钮：a_add(null, '2')
 * //    - 最大按钮：a_add(null, '3')
 * //    - 减1按钮：a_minus(null, '1')
 * //    - 减10按钮：a_minus(null, '2')
 * //    - 最小按钮：a_minus(null, '3')
 * // 3. 监听数值变化：
 * no.EventHandlerInfo.add(this.node, 'YJQuantity', 'onChange', (num) => {
 *     cc.log('当前数量:', num);
 * });
 * 
 * // 代码初始化示例：
 * const quantity = this.node.getComponent(YJQuantity);
 * quantity.data = { num: 5, min: 1, max: 20 }; // 初始数量5，范围1-20
 */
export class YJQuantity extends YJDataWork {
    /** 是否显示±1操作按钮 */
    @property({ displayName: '加减1', tooltip: '启用±1操作按钮' })
    a1: boolean = true;
    /** 是否显示±10操作按钮 */
    @property({ displayName: '加减10', tooltip: '启用±10操作按钮（当启用自定义时被替换）' })
    a10: boolean = false;
    /** 是否显示最大/最小操作按钮 */
    @property({ displayName: '最大最小', tooltip: '启用直接跳转最大/最小值功能' })
    amax: boolean = false;
    /** 是否在UI中显示最大数量（格式：当前数/最大数） */
    @property({ displayName: '显示最大数量', tooltip: '在界面显示最大数量限制' })
    isShowMax: boolean = true;
    /** 是否启用自定义步长（启用后将替换±10按钮的功能） */
    @property({ displayName: '自定义', tooltip: '使用自定义增减步长替代±10功能' })
    isCustom: boolean = false;
    /** 自定义增减数量（仅在启用自定义时生效） */
    @property({ displayName: '自定义加减数量', visible() { return this.isCustom; }, tooltip: '自定义单次增减数值（可正负）' })
    customNum: number = 5;
    /** 数值变化事件处理器 */
    @property({ type: no.EventHandlerInfo, tooltip: '数量变化时触发事件，参数为最新数值' })
    onChange: no.EventHandlerInfo[] = [];

    /** 实际使用的自定义步长（根据isCustom配置自动计算） */
    private _customNum: number;

    /**
     * 组件初始化方法
     * @description 合并默认数据与传入数据，初始化操作配置
     */
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

    /**
     * 数据初始化后处理
     * @description 更新最大数量显示状态
     */
    protected afterDataInit() {
        if (this.isShowMax) {
            this.setValue('maxNum', '/' + this.data.max);
        } else {
            this.setValue('maxNum', '');
        }
    }

    /**
     * 增加数量操作
     * @param e 事件对象（通常由按钮事件自动传入）
     * @param type 操作类型 
     * '1' - 加1 
     * '2' - 加10或自定义值 
     * '3' - 直接设为最大值
     */
    public a_add(e: any, type: string) {
        let v = 1;
        switch (type) {
            case '2':// 步进增加（10/自定义值）
                v = this._customNum;
                break;
            case '3':// 设为最大值
                v = this.data.max - this.data.num; // 计算与最大值的差值
                break;
        }
        this.setNum(v);
    }

    /**
     * 减少数量操作
     * @param e 事件对象（通常由按钮事件自动传入）
     * @param type 操作类型 
     * '1' - 减1 
     * '2' - 减10或自定义值 
     * '3' - 直接设为最小值
     */
    public a_minus(e: any, type: string) {
        let v = -1;
        switch (type) {
            case '2':// 步进减少（10/自定义值）
                v = -this._customNum;
                break;
            case '3':// 设为最小值
                v = -this.data.num; // 直接减到0（最小值）
                break;
        }
        this.setNum(v);
    }

    /**
     * 执行数值变更
     * @param v 要增加/减少的数值（可为正负）
     * @description 处理数值边界，触发变更事件
     */
    private setNum(v: number) {
        const min = this.data.min,
            max = this.data.max,
            o = this.data.num;
        let num = o + v;
        // 边界检查
        num = Math.max(min, Math.min(max, num));
        if (num != o) {
            this.setValue('num', num);
            no.EventHandlerInfo.execute(this.onChange, num);
        }
    }
}