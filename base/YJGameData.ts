import { ccclass } from '../../common/yj';
import { no } from '../no';

/**
 * 游戏数据基类
 * Author mqsy_yj
 * DateTime Tue Jul 11 2023 16:40:10 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJGameData')
/**
 * 游戏数据基类
 * @abstract 提供数据状态管理和变更检测的基础功能
 * @example
 * // 创建子类继承
 * class PlayerData extends YJGameData {
 *     protected onInit() {
 *         this.set('gold', 0);
 *     }
 * }
 * 
 * // 获取单例实例
 * const player = PlayerData.instance();
 */
export class YJGameData extends no.Data {
    /** 单例实例缓存 */
    private static _insMap: { [key: string]: any } = {};
    /** 数据状态管理器 */
    private _state: no.State;

    /**
     * 获取单例实例
     * @returns 当前类的单例实例
     * @example
     * // 获取玩家数据单例
     * const playerData = PlayerData.instance();
     */
    public static instance(key?: string): any {
        key = key || '_';
        if (!this._insMap[key]) {
            const a = new this();
            a._state = new no.State();
            a.onInit();
            this._insMap[key] = a;
        }
        return this._insMap[key];
    }

    /**
     * 初始化钩子方法
     * @virtual 子类可覆盖实现初始化逻辑
     * @example
     * // 在子类中初始化默认值
     * protected onInit() {
     *     this.set('level', 1);
     *     this.set('exp', 0);
     * }
     */
    protected onInit() {

    }

    /**
     * 检测数据变更状态
     * @param target 检测目标对象 
     * @returns 是否发生过数据变更
     * @example
     * // 在监听回调中检测变化
     * data.onChange(() => {
     *     if (data.checkStateChange(this)) {
     *         updateUI();
     *     }
     * });
     */
    public checkStateChange(target: any): boolean {
        return this._state.check('data_change', target).state;
    }

    /**
     * 标记数据变更状态
     * @description 通常在数据修改后自动调用
     */
    public updateStateChange() {
        this._state.set('data_change');
    }

    /**
     * 设置数据值并触发变更检测
     * @param path 数据路径 
     * @param value 要设置的值
     * @param recursive 是否递归设置
     * @returns 当前实例（支持链式调用）
     * @example
     * // 设置玩家金币并触发更新
     * playerData.set('gold', 1000);
     * 
     * // 链式调用设置多个值
     * playerData.set('hp', 100)
     *          .set('mp', 50);
     */
    public set(path: string, value: any, recursive = true) {
        super.set(path, value, recursive);
        this.updateStateChange();
        return this;
    }
}
