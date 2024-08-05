
import { _decorator, CCClass, Component, Enum, js, Node, sys } from 'cc';
import { EDITOR, JSB } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJEnableComponentForJSB
 * DateTime = Mon Jul 10 2023 09:13:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJEnableComponentForJSB.ts
 * FileBasenameNoExtension = YJEnableComponentForJSB
 * URL = db://assets/NoUi3/base/YJEnableComponentForJSB.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
enum ComponentName {
}
//根据平台类型设置组件是否激活
@ccclass('YJEnableComponentForJSB')
@executeInEditMode()
export class YJEnableComponentForJSB extends Component {
    @property(Node)
    target: Node = null;
    @property({ type: Enum(ComponentName) })
    component: number = 0;
    @property({ visible() { return false } })
    componentNames: string[] = [];
    @property({ displayName: '支持Web' })
    web: boolean = true;
    @property({ displayName: '支持Apple' })
    ios: boolean = true;
    @property({ displayName: '支持Android' })
    android: boolean = true;

    private _target: Node = null;

    onLoad() {
        if (EDITOR) return;
        if (!this.enabled) return;
        let a = true;
        if (!JSB && !this.web) a = false;
        else if (JSB && sys.platform == sys.Platform.IOS && !this.ios) a = false;
        else if (JSB && sys.platform == sys.Platform.ANDROID && !this.android) a = false;
        this.setEnable(a);
    }

    private setEnable(v: boolean) {
        let name = this.componentNames[this.component];
        if (!name) return;
        if (this.getComponent(name))
            this.getComponent(name).enabled = v;
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
        CCClass.Attr.setClassAttr(YJEnableComponentForJSB, 'component', 'enumList', list);
    }
}
