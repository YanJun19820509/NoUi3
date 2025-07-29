import { ccclass, property, Enum, Node, EDITOR, js, CCClass } from '../yj';
import { HackUi } from './HackUi';

//动态设置组件属性值
enum ComponentName { }
enum PropertyName { }
@ccclass('SetComponentPropertyValue')
/**
 * 组件属性动态设置基类
 * 
 * @功能说明
 * - 提供动态设置任意组件属性的基础能力
 * - 支持编辑器模式下实时更新组件/属性枚举
 * - 通过数据驱动方式更新属性值
 * - 支持扩展特定属性的设置逻辑（如SetComponentEnable）
 * 
 * @使用示例
 * // 数据驱动设置属性值
 * a_setData(123); // 设置当前选中的属性值为123
 * 
 * // 编辑器操作步骤：
 * 1. 将组件挂载到任意节点
 * 2. 拖拽目标节点到target属性
 * 3. 在component下拉框选择组件类型
 * 4. 在property下拉框选择属性名
 * 5. 运行时通过数据或API控制属性值
 */
export class SetComponentPropertyValue extends HackUi {
    // 目标节点（需要设置属性的节点）
    @property(Node)
    target: Node = null;
    
    // 组件类型枚举选择（自动生成）
    @property({ type: Enum(ComponentName) })
    component: number = 0;
    
    // 组件名称列表（存储实际组件类名）
    @property({ visible() { return false } })
    componentNames: string[] = [];
    
    // 属性名称枚举选择（自动生成）
    @property({ type: Enum(PropertyName) })
    property: number = 0;
    
    // 属性名称列表（存储实际属性名）
    @property({ visible() { return false } })
    propertyNames: string[] = [];

    // 内部跟踪用的节点和组件索引
    private _target: Node = null;
    private _component: number;

    /**
     * 数据变化回调处理
     * @param data 传入的属性值，自动转换为合适类型
     * @example
     * a_setData(0.5); // 设置数值型属性
     * a_setData("text"); // 设置字符串属性
     */
    protected onDataChange(data: any) {
        this.setPropertyValue(data);
    }

    /**
     * 编辑器更新检测
     * 实时同步组件/属性枚举变化
     */
    update() {
        if (!EDITOR) return;
        // 检测目标节点变化
        if (this.target != this._target) {
            this._target = this.target;
            this.setComonentEnum();
        }
        // 检测组件选择变化
        if (this.component != this._component) {
            this._component = this.component;
            this.setPropertyEnum();
        }
    }

    /**
     * 生成组件枚举列表
     * 根据目标节点挂载的组件动态生成
     */
    private setComonentEnum() {
        if (!this._target) {
            this.setEnum({}, 'component');
            this.setEnum({}, 'property');
        } else {
            let cs = this._target.components;
            let a: any = {};
            // 遍历所有组件，排除自身类型
            for (let i = 0; i < cs.length; i++) {
                let name = js.getClassName(cs[i]);
                if (name == 'SetComponentPropertyValue') continue;
                a[name] = i;
                this.componentNames[i] = name;
            }
            this.setEnum(a, 'component');
        }
    }

    /**
     * 动态设置枚举类型
     * @param obj 枚举键值对
     * @param type 要设置的属性类型（component/property）
     */
    private setEnum(obj: any, type: string) {
        let e = Enum(obj);
        let list = Enum.getList(e);
        CCClass.Attr.setClassAttr(SetComponentPropertyValue, type, 'enumList', list);
    }

    /**
     * 生成属性枚举列表
     * 根据选中的组件类型解析其属性
     * 
     * @实现说明
     * 1. 通过CCClass反射系统获取组件类属性
     * 2. 过滤掉内部属性（以_或$$开头的属性）
     * 3. 提取可序列化的属性（包含类型标记的属性）
     */
    protected setPropertyEnum() {
        if (!this._target) {
            this.setEnum({}, 'property');
            return;
        }
        const clazz = js.getClassByName(this.componentNames[this.component]);
        const attrs = CCClass.Attr.getClassAttrs(clazz);
        const aa = '$_$type'; // 属性类型标记
        let a: any = {}, i = 0;
        
        // 遍历所有类属性
        for (const key in attrs) {
            // 过滤内部属性
            if (key.indexOf('$$') > -1 || key.indexOf('_') == 0) continue;
            // 提取有类型定义的属性
            if (key.indexOf(aa) > -1) {
                const name = key.split(aa)[0];
                a[name] = i;
                this.propertyNames[i] = name;
                i++;
            }
        }
        this.setEnum(a, 'property');
    }

    /**
     * 设置实际属性值
     * @param data 要设置的值（自动转换类型）
     * @TODO 需要扩展支持更多类型属性
     * @example
     * setPropertyValue(true); // 设置布尔值
     * setPropertyValue(100);  // 设置数值
     */
    public setPropertyValue(data: any) {
        let name = this.componentNames[this.component];
        if (!name) return;
        // 当前仅实现enabled属性的设置
        // 派生类应重写此方法实现具体属性设置
        if (this.getComponent(name))
            this.getComponent(name).enabled = Boolean(data);
    }
}


