import { Component, DEBUG, EDITOR, ccclass, executeInEditMode, isValid, property, Node } from '../yj';
import { no } from '../no';
import { YJJobManager } from '../base/YJJobManager';

// export const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = HackUi
 * DateTime = Thu Jan 13 2022 00:19:10 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = HackUi.ts
 * FileBasenameNoExtension = HackUi
 * URL = db://assets/Script/common/ui/HackUi.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
* 设置ui属性的基类
*/
@ccclass('HackUi')
@executeInEditMode()
/**
 * 
 * UI组件基类 HackUi 使用说明
 * 
 * 【核心功能】
 * 1. 数据驱动UI更新 - 通过绑定数据键值自动更新UI状态
 * 2. 编辑器集成 - 支持在Cocos Creator编辑器中直接配置属性
 * 3. 生命周期控制 - 提供onLoad、setData等标准生命周期方法
 * 4. 数据绑定 - 通过bind_keys实现多键值数据绑定
 * 
 * 【使用示例】
 * // 继承实现具体UI组件
 * @ccclass
 * class SetPosition extends HackUi {
 *   protected onDataChange(data: any) {
 *     this.node.position = data.position;
 *   }
 * }
 * 
 * 【主要方法说明】
 * - onLoad(): 组件加载时初始化数据绑定
 * - setData(): 核心数据更新方法，处理数据变更逻辑
 * - onDataChange(): 子类需实现的抽象方法，接收数据变化回调
 * 
 * 【属性说明】
 * - registerNode: 关联的YJDataWork节点，用于数据监听
 * - bind_keys: 支持多个数据键绑定（用逗号分隔）
 * - once: 标记组件是否只执行一次数据绑定
 * - showValueLog: 调试模式开关，输出赋值日志
 * 
 * 【设计理念】
 * 采用"脏数据检查"机制，通过dataDirty标记管理更新状态
 * 与YJDataWork配合实现响应式数据流，适合复杂UI数据绑定场景
 */
export class HackUi extends Component {
    // ================================= 核心数据绑定配置 =================================
    /** 
     * 【编辑器专用】关联的YJDataWork节点 
     * @功能 用于在编辑器中自动查找并绑定数据源节点
     * @示例 
     * - 在层级面板拖拽带有YJDataWork组件的节点到此属性
     * - 留空时自动在父级节点中查找YJDataWork组件
     */
    @property({ type: Node, editorOnly: true })
    registerNode: Node = null;

    /**
     * 数据绑定键值集合（支持多键绑定）
     * @格式 用英文逗号分隔的字符串，如："hp,mp,level"
     * @限制 不支持形如"player.hp"的多级键值
     * @示例 
     * - 绑定单个键: "score"
     * - 绑定多个键: "name,avatar,status"
     */
    @property({ displayName: '绑定数据的keys', tooltip: '用,分隔多个key，不支持用.表示key的层级关系' })
    bind_keys: string = '';

    /**
     * 单次执行模式开关
     * @功能 设置为true时，组件在首次数据赋值后自动销毁
     * @适用场景 适用于只需要初始化一次的UI元素（如弹窗标题）
     * @注意事项 启用后无法响应后续数据变化
     */
    @property({ displayName: '只赋值一次' })
    once: boolean = false;

    // @property({ displayName: '重值忽略', tooltip: '如果输入的数据与上一次相同则忽略' })
    // saveIgnore: boolean = true;

    /**
     * 调试日志开关
     * @功能 启用后会在控制台输出数据赋值日志
     * @调试建议 
     * - 开发阶段建议开启
     * - 发布版本应关闭以提升性能
     */
    @property({ displayName: '输出赋值日志' })
    showValueLog: boolean = false;

    /** 
     * 数据脏标记 
     * @作用 标识当前是否有待处理的数据更新
     * @工作机制 
     * 1. 当接收到新数据时标记为true
     * 2. 在syncData()处理后被重置为false
     */
    public dataDirty: boolean = false;

    /**
     * 数据缓存引用
     * @作用 存储最后一次有效数据用于比较
     * @存储格式 通过no.Data类型保存结构化数据
     */
    private _oldData: no.Data;

    /**
     * 组件初始化生命周期回调
     * @功能 实现数据绑定的初始化配置
     * @编辑器行为:
     * - 自动查找父级YJDataWork节点
     * @运行时行为:
     * 1. 禁用update方法提升性能
     * 2. 校验bind_keys格式合法性
     * @示例
     * // 当组件挂载时：
     * // - 编辑器模式：自动注册数据源
     * // - 运行时模式：初始化数据监听
     */
    onLoad() {
        if (EDITOR) {
            // 编辑器环境下自动配置数据源
            if (!this.registerNode) {
                // 使用no工具查找父节点中的YJDataWork组件
                this.registerNode = no.getComponentInParents(this.node, 'YJDataWork')?.node;
            }
        } else {
            // 运行时优化：禁用未使用的update循环
            this.update = function () { };

            // 开发环境下进行格式校验
            if (DEBUG) {
                // 检测非法格式的key（包含.字符）
                if (this.bind_keys.indexOf('.') != -1) {
                    no.err('HackUi不支持多级key', this.uuid, this.bind_keys);
                }
            }
        }
    }

    /**
     * 设置数据工作区的数据引用（仅供YJDataWork内部使用）
     * @param d 要设置的新数据
     * @returns void
     * 
     * @功能说明
     * - 更新组件内部缓存的数据引用
     * - 执行数据有效性校验（节点是否有效）
     * - 后续可通过getValue()获取处理后的数据
     * 
     * @注意事项
     * - 需配合YJDataWork的数据更新机制使用
     * - 被注释代码为原始数据比对和任务队列逻辑，当前版本已简化
     * 
     * @示例
     * // 当收到新数据时：
     * setData({ 
     *     score: 100, 
     *     name: 'player1' 
     * });
     * // 将更新_oldData引用，后续syncData()时会触发onDataChange
     */
    private setData(d: any) {
        // 节点有效性检查（防止已销毁节点处理数据）
        if (!isValid(this?.node)) return;

        // 更新数据引用
        this._oldData = d;
    }

    /**
     * 获取绑定键对应的数据值
     * @returns {any} 根据bind_keys组合的数据
     * 
     * @数据规则
     * - 单键模式：直接返回对应键值（如 bind_keys="score" → 返回100）
     * - 多键模式：返回键值对象（如 bind_keys="score,name" → 返回{score:100, name:'player1'}）
     * 
     * @示例
     * // 绑定单个键：
     * getValue() → 100 // 当bind_keys="score"
     * 
     * // 绑定多个键：
     * getValue() → { 
     *     score: 100,
     *     name: 'player1'
     * } // 当bind_keys="score,name"
     */
    public getValue() {
        if (!this._oldData) return null;
        let keys = this.bindKeys;
        let a: any;

        // 单键直接取值
        if (keys.length == 1) {
            a = this._oldData.data[keys[0]];
        }
        // 多键组合成对象
        else {
            a = {};
            for (let i = 0; i < keys.length; i++) {
                a[keys[i]] = this._oldData.data[keys[i]];
            }
        }
        return a;
    }

    /**
     * 将缓存数据同步到UI组件
     * @执行流程:
     * 1. 检查数据脏标记(dataDirty)，无更新则直接返回
     * 2. 提交异步任务到YJJobManager
     * 3. 在任务中获取绑定数据值
     * 4. 数据为空时调用清空UI方法
     * 5. 记录调试日志
     * 6. 触发子类的具体数据更新逻辑
     * 7. 根据once标记决定是否销毁组件
     * 
     * @示例
     * 当数据发生变化时调用：
     * this.syncData();
     * 将触发YJJobManager的任务队列，在下一帧更新UI
     */
    public syncData() {
        if (!this.dataDirty) return;
        this.dataDirty = false;
        YJJobManager.ins.addTask(() => {
            let a = this.getValue();
            if (a == null) {
                this.a_setEmpty();
                return true;
            }
            this.logValue(a);
            this.onDataChange(a);
            if (this.once) {
                this.destroy();
            }
            return true;
        });
    }

    private _keys: string[];
    /**
     * 获取绑定键名的数组形式
     * @缓存机制: 首次访问时分割字符串并缓存结果
     * @returns 解析后的键名数组
     * 
     * @示例
     * 当bind_keys = "score,name" 时
     * 返回 ["score", "name"]
     */
    public get bindKeys(): string[] {
        if (!this._keys) this._keys = this.bind_keys.split(',');
        return this._keys;
    }

    /**
     * 记录数据值调试日志
     * @param data 要记录的数据
     * @调试条件: 需要同时满足DEBUG模式和showValueLog开启
     * 
     * @示例输出:
     * "[SetLabel] score,name => {score:100, name:'player1'}"
     */
    private logValue(data: any): void {
        if (!DEBUG || !this.showValueLog) return;
        no.log(this.name, this.bind_keys, data);
    }

    /**
     * 动态设置组件属性值
     * @param propertyName 属性名称
     * @param v 要设置的值
     * 
     * @使用示例:
     * setPropertyValue('labelString', '新文本');
     * 等效于 this.labelString = '新文本'
     */
    public setPropertyValue(propertyName: string, v: any): void {
        this[propertyName] = v;
    }

    /**
     * 直接更新UI数据（不修改原始数据引用）
     * @param e 事件对象或数据值
     * @param v 可选，直接传递的数据值
     * 
     * @与setData区别:
     * - 直接操作UI显示，不影响dataWork的原始数据
     * - 适用于临时性UI状态更新
     * 
     * @使用示例:
     * // 直接更新显示值
     * a_setData({score: 95});
     * // 通过事件对象更新
     * button.node.on('click', (e) => a_setData(e, 100));
     */
    public a_setData(e: any, v?: any) {
        v = v || e;
        this.logValue(v);
        this.onDataChange(v);
        if (this.once) {
            this.destroy();
        }
    }

    /**
     * 重置数据状态标记
     * @作用: 将数据标记为脏数据，触发下次syncData时重新刷新UI
     * 
     * @使用场景:
     * 当已知底层数据已变更但未通过setData设置时，
     * 可调用此方法强制刷新UI
     */
    public resetData(): void {
        if (!this.dataSetted) return;
        this.dataDirty = true;
    }

    /**
     * 数据是否已设置状态标识
     * @returns 当前是否持有有效数据引用
     */
    public get dataSetted(): boolean {
        return this._oldData != null;
    }

    /**
     * 清除指定键值数据
     * @param key 要清除的数据键名
     * 
     * @注意: 
     * - 仅清除数据副本，不影响原始数据源
     * - 需要手动调用syncData触发UI更新
     * 
     * @示例:
     * clearDataValue('score'); // 删除score字段
     * syncData(); // 更新UI显示
     */
    protected clearDataValue(key: string) {
        if (!this._oldData) return;
        no.deleteValue(this._oldData.data, key);
    }

    /**
     * 对dataWork进行修改或设置数据
     * @param key 键
     * @param value 值
     */
    protected setDataValue(key: string, value: any) {
        if (!this._oldData) return;
        no.setValue(this._oldData.data, key, value);
    }

    /**
     * 获取dataWork的数据值
     * @param key 键
     * @returns 值
     */
    protected getDataValue(key: string) {
        if (!this._oldData) return null;
        return this._oldData.data[key];
    }

    /**
     * 数据变更处理模板方法（需子类实现）
     * @param data 更新后的数据
     * 
     * @子类实现示例:
     * protected onDataChange(data: any) {
     *     this.label.string = data.score;
     *     this.icon.spriteFrame = data.icon;
     * }
     */
    protected onDataChange(data: any) {

    }

    /**
     * 清空UI显示内容模板方法（需子类实现）
     * 
     * @子类实现示例:
     * public a_setEmpty(): void {
     *     this.label.string = '';
     *     this.icon.spriteFrame = null;
     * }
     */
    public a_setEmpty(): void {

    }

}
