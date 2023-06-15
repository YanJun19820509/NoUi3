
import { ccclass, property, executeInEditMode, Component, Node, js } from '../yj';
import { EDITOR } from 'cc/env';

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
@executeInEditMode()
export class YJCloneComponent extends Component {
    @property(Node)
    target: Node = null;
    @property
    asyncPosition: boolean = false;

    update() {
        if (!EDITOR) return;
        if (!this.target) return;
        this.setNodeProperties();
        let comps = this.target.getComponents(Component);
        comps.forEach(comp => {
            if (!comp.enabled) return;
            this.addComp(comp);
        });
        this.target = null;
    }

    private setNodeProperties() {
        if (!this.asyncPosition) return;
        this.node.position = this.target.position;
        this.node.rotation = this.target.rotation;
        this.node.scale = this.target.scale;
        this.node.layer = this.target.layer;
    }

    private addComp(comp: Component) {
        let name = js.getClassName(comp);
        let props = this.getProperties(name);
        let a = this.node.getComponent(name) || this.node.addComponent(name);
        props.forEach(p => {
            a[p] = comp[p];
        });
    }

    private getProperties(className: string): string[] {
        let props: string[] = js.getClassByName(className)['__props__'];
        // console.log(props)
        let a: string[] = [];
        props.forEach(p => {
            if (p == 'node' || p.indexOf('_') == 0) return;
            a[a.length] = p;
        });
        return a;
    }
}
