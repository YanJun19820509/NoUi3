
import { no } from '../no';
import { ccclass, property, executeInEditMode, Component, Node, js } from '../yj';

/**
 * Predefined variables
 * Name = YJCloneComponent
 * DateTime = Fri Jun 24 2022 16:35:58 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJCloneComponent.ts
 * FileBasenameNoExtension = YJCloneComponent
 * URL = db://assets/NoUi3/base/YJCloneComponent.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 节点组件clone，将target节点上node属性和enabled的组件clone到当前节点上
 */
@ccclass('YJCloneComponent')
/**
 * 节点组件克隆组件
 * @description 用于克隆目标节点的属性和启用的组件到当前节点
 * @example
 * // 编辑器配置示例：
 * // - Target: 需要克隆的目标节点
 * // - Async Position: 勾选以同步位置/旋转/缩放
 * // - Async UI Transform: 勾选以同步尺寸/锚点
 * 
 * @example
 * // 代码调用示例：
 * const cloneComp = this.getComponent(YJCloneComponent);
 * cloneComp.target = targetNode; // 设置克隆目标后自动执行克隆
 */
export class YJCloneComponent extends Component {
    /**
     * 要克隆的目标节点
     * @property 设置后会立即执行克隆操作
     * @remarks 会自动克隆目标节点的属性和所有启用的组件
     */
    @property(Node)
    public get target(): Node {
        return null;
    }

    public set target(v: Node) {
        this.setNodeProperties(v);
        let comps = v.getComponents(Component);
        for (let i = 0; i < comps.length; i++) {
            const comp = comps[i];
            if (!comp.enabled) continue;
            this.addComp(comp);
        }
    }

    /** 是否同步位置/旋转/缩放/图层属性 */
    @property
    asyncPosition: boolean = false;
    
    /** 是否同步UI尺寸和锚点属性 */
    @property
    asyncUITransform: boolean = false;

    /**
     * 设置节点基础属性
     * @param target 要克隆的目标节点
     */
    private setNodeProperties(target: Node) {
        if (this.asyncPosition) {
            this.node.position = target.position;
            this.node.rotation = target.rotation;
            this.node.scale = target.scale;
            this.node.layer = target.layer;
        }
        if (this.asyncUITransform) {
            no.size(this.node, no.size(target));
            const anchor = no.anchor(target);
            no.anchor(this.node, anchor.x, anchor.y);
        }
    }

    /**
     * 添加并配置组件
     * @param comp 要克隆的源组件
     */
    private addComp(comp: Component) {
        let name = js.getClassName(comp);
        let props = this.getProperties(name);
        let a = this.node.getComponent(name) || this.node.addComponent(name);
        for (let i = 0; i < props.length; i++) {
            const p = props[i];
            a[p] = comp[p];
        }
    }

    /**
     * 获取可克隆的属性列表
     * @param className 组件类名
     * @returns 过滤后的属性名称数组（排除node和私有属性）
     */
    private getProperties(className: string): string[] {
        let props: string[] = js.getClassByName(className)['__props__'];
        let a: string[] = [];
        for (let i = 0; i < props.length; i++) {
            const p = props[i];
            if (p == 'node' || p.indexOf('_') == 0) continue;
            a[a.length] = p;
        }
        return a;
    }
}
