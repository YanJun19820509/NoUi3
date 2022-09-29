
import { _decorator, Component, Node, Enum, CCClass, js } from 'cc';
import { EDITOR } from 'cc/env';
import { FuckUi } from './FuckUi';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = SetComponentEnable
 * DateTime = Mon Sep 19 2022 14:57:34 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetComponentEnable.ts
 * FileBasenameNoExtension = SetComponentEnable
 * URL = db://assets/NoUi3/fuckui/SetComponentEnable.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
enum ComponentName {
}

@ccclass('SetComponentEnable')
@executeInEditMode()
export class SetComponentEnable extends FuckUi {
    @property(Node)
    target: Node = null;
    @property({ type: Enum(ComponentName) })
    component: number = 0;
    @property({ visible() { return false } })
    componentNames: string[] = [];

    private _target: Node = null;

    protected onDataChange(data: any) {
        let name = this.componentNames[this.component];
        if (!name) return;
        if (this.getComponent(name))
            this.getComponent(name).enabled = Boolean(data);
    }

    update() {
        if (!EDITOR) return;
        if (this.target == this._target) return;
        this._target = this.target;
        this.setComonentEnum();
    }

    private setComonentEnum() {
        if (!this._target) {
            this.setEnum({});
        } else {
            let cs = this._target.components;
            let a: any = {};
            cs.forEach((c, i) => {
                let name = js.getClassName(c);
                if (name == 'SetComponentEnable') return;
                a[name] = i;
                this.componentNames[i] = name;
            });
            this.setEnum(a);
        }
    }

    private setEnum(obj: any) {
        let e = Enum(obj);
        let list = Enum.getList(e);
        CCClass.Attr.setClassAttr(SetComponentEnable, 'component', 'enumList', list);
    }

    public a_enable(): void {
        this.onDataChange(true);
    }

    public a_disable(): void {
        this.onDataChange(false);
    }

}
