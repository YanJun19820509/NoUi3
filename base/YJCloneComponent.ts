
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
export class YJCloneComponent extends Component {
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
    @property
    asyncPosition: boolean = false;
    @property
    asyncUITransform: boolean = false;

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

    private addComp(comp: Component) {
        let name = js.getClassName(comp);
        let props = this.getProperties(name);
        let a = this.node.getComponent(name) || this.node.addComponent(name);
        for (let i = 0; i < props.length; i++) {
            const p = props[i];
            a[p] = comp[p];
        }
    }

    private getProperties(className: string): string[] {
        let props: string[] = js.getClassByName(className)['__props__'];
        // console.log(props)
        let a: string[] = [];
        for (let i = 0; i < props.length; i++) {
            const p = props[i];
            if (p == 'node' || p.indexOf('_') == 0) continue;
            a[a.length] = p;
        }
        return a;
    }
}
