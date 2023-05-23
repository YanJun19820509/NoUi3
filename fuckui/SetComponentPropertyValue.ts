import { _decorator, Component, Node } from 'cc';
import { FuckUi } from './FuckUi';
import { Enum } from 'cc';
import { EDITOR } from 'cc/env';
import { js } from 'cc';
import { CCClass } from 'cc';
const { ccclass, property } = _decorator;
//动态设置组件属性值
enum ComponentName { }
enum PropertyName { }
@ccclass('SetComponentPropertyValue')
export class SetComponentPropertyValue extends FuckUi {
    @property(Node)
    target: Node = null;
    @property({ type: Enum(ComponentName) })
    component: number = 0;
    @property({ visible() { return false } })
    componentNames: string[] = [];
    @property({ type: Enum(PropertyName) })
    property: number = 0;
    @property({ visible() { return false } })
    propertyNames: string[] = [];

    private _target: Node = null;
    private _component: number;

    protected onDataChange(data: any) {
        this.setPropertyValue(data);
    }

    update() {
        if (!EDITOR) return;
        if (this.target != this._target) {
            this._target = this.target;
            this.setComonentEnum();
        }
        if (this.component != this._component) {
            this._component = this.component;
            this.setPropertyEnum();
        }
    }

    private setComonentEnum() {
        if (!this._target) {
            this.setEnum({}, 'component');
            this.setEnum({}, 'property');
        } else {
            let cs = this._target.components;
            let a: any = {};
            cs.forEach((c, i) => {
                let name = js.getClassName(c);
                if (name == 'SetComponentPropertyValue') return;
                a[name] = i;
                this.componentNames[i] = name;
            });
            this.setEnum(a, 'component');
        }
    }

    private setEnum(obj: any, type: string) {
        let e = Enum(obj);
        let list = Enum.getList(e);
        CCClass.Attr.setClassAttr(SetComponentPropertyValue, type, 'enumList', list);
    }

    protected setPropertyEnum() {
        if (!this._target) {
            this.setEnum({}, 'property');
            return;
        }
        const clazz = js.getClassByName(this.componentNames[this.component]);
        const attrs = CCClass.Attr.getClassAttrs(clazz);
        console.log(attrs);
        const aa = '$_$type';
        let a: any = {}, i = 0;
        for (const key in attrs) {
            if (key.indexOf('$$') > -1 || key.indexOf('_') == 0) continue;
            if (key.indexOf(aa) > -1) {
                console.log(key)
                const name = key.split(aa)[0];
                a[name] = i;
                this.propertyNames[i] = name;
                i++;
            }
        }
        console.log(a);
        this.setEnum(a, 'property');
    }


    public setPropertyValue(data: any) {
        let name = this.componentNames[this.component];
        if (!name) return;
        if (this.getComponent(name))
            this.getComponent(name).enabled = Boolean(data);
    }
}


