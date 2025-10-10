import { YJDataWork } from '../base/YJDataWork';
import { no } from '../no';
import { ccclass, js, property } from '../yj';
import { YJGameData } from './YJGameData';

/**
 * 数据映射
 * Author mqsy_yj
 * DateTime Tue Jul 11 2023 16:28:37 GMT+0800 (中国标准时间)
 *
 */
@ccclass('YJDataMapInfo')
/**
 * 数据映射配置信息
 * @class 用于定义数据源与UI之间的映射关系
 * @property dataKeys 数据键集合（多个用逗号分隔）
 * @property uiKey UI组件对应的数据键
 * 
 * @example
 * // 单键映射示例：
 * // dataKeys = "playerLevel"
 * // uiKey = "levelText"
 * // 将玩家等级数据绑定到文本组件
 * 
 * @example
 * // 多键映射示例：
 * // dataKeys = "hp,maxHp"
 * // uiKey = "hpProgress"
 * // 将当前血量和最大血量绑定到进度条组件
 */
export class YJDataMapInfo {
    @property({ displayName: '数据key', tooltip: '如果对应多个key用,分隔，将解析为kv结构' })
    dataKeys: string = '';
    
    @property({ displayName: 'UI组件key' })
    uiKey: string = '';

    /**
     * 从数据源获取对应数据
     * @param dataSource 游戏数据源实例
     * @returns 单个数据值或键值对对象
     * 
     * @example
     * // 当dataKeys为"gold"时返回数值
     * // 当dataKeys为"positionX,positionY"时返回{x:100,y:200}
     * 
     * @example
     * // 处理函数型数据源：
     * // dataSource定义：get playerName() { return "张三"; }
     * // dataKeys = "playerName" 将返回"张三"
     */
    public getData(dataSource: YJGameData): any {
        const keys = this.dataKeys?.split(',') || [];
        if (keys.length == 1) {
            const k = keys[0];
            if (typeof dataSource[k] == 'function') {
                return dataSource[k]();
            } else {
                let v = dataSource[k];
                if (v == null) v = dataSource.get(k);
                return v;
            }
        }
        let a: any = {};
        for (let i = 0, n = keys.length; i < n; i++) {
            let k = keys[i];
            let v = dataSource[k];
            if (v == null) v = dataSource.get(k);
            a[k] = v;
        }
        return a;
    }
}
@ccclass('YJDataMap')
/**
 * 数据映射组件
 * @class 实现游戏数据到UI组件的自动绑定与同步
 * @example
 * // 编辑器配置示例：
 * // - 数据源: PlayerData (继承YJGameData的类)
 * // - 键映射:
 * //   - 数据key: hp → UI组件key: hpProgress
 * //   - 数据key: gold → UI组件key: goldLabel
 * 
 * @example
 * // 当PlayerData的hp值变化时，自动更新hpProgress组件
 * // 当gold值变化时，自动更新goldLabel文本
 */
export class YJDataMap extends YJDataWork {
    /** 
     * 数据源类名（需继承YJGameData）
     * @example 'PlayerData' 表示使用玩家数据类
     */
    @property({ displayName: '数据源', tooltip: '数据对象类名，继承YJGameData' })
    dataSourceClassName: string = '';
    
    /** 
     * 数据键映射配置列表 
     * @remarks 每个配置项定义一组数据到UI的映射关系
     */
    @property({ type: YJDataMapInfo })
    keyMaps: YJDataMapInfo[] = [];

    /** 缓存的数据源实例 */
    private _dataSource: YJGameData;

    /**
     * 初始化后处理
     * @description 获取数据源实例并建立数据变更监听
     * @example
     * // 当数据源类名为'PlayerData'时：
     * // 1. 获取PlayerData单例
     * // 2. 监听数据变化自动同步到UI
     */
    protected afterInit() {
        if (!this._dataSource) {
            no.unschedule(this);
            const c = js.getClassByName(this.dataSourceClassName) as (typeof YJGameData);
            this._dataSource = c.instance();
            if (this._dataSource) {
                this._dataSource.onChange(this.syncWithDataSource, this);
            }
        }
        this.syncWithDataSource();
    }

    /**
     * 组件销毁时处理
     * @description 移除数据变更监听防止内存泄漏
     */
    onDestroy() {
        if (this._dataSource) {
            this._dataSource.offChange(this.syncWithDataSource, this);
        }
    }

    /**
     * 同步数据到UI组件
     * @description 遍历所有键映射配置，更新对应UI组件
     * @example
     * // 当数据源变化时：
     * // 1. 获取所有配置的dataKeys对应数据
     * // 2. 通过setValue更新对应uiKey的组件
     */
    protected syncWithDataSource() {
        if (!this._dataSource) return;
        for (let i = 0; i < this.keyMaps.length; i++) {
            const km = this.keyMaps[i];
            this.setValue(km.uiKey, km.getData(this._dataSource));
        }
    }
}