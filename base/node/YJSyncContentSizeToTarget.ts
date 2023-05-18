
import { _decorator, Component, Node, UITransform, math, isValid, macro } from 'cc';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJSyncContentSizeToTarget
 * DateTime = Tue Jul 19 2022 11:26:54 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSyncContentSizeToTarget.ts
 * FileBasenameNoExtension = YJSyncContentSizeToTarget
 * URL = db://assets/NoUi3/base/node/YJSyncContentSizeToTarget.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//同步目标节点的contentSize，受scale影响
@ccclass('YJSyncContentSizeToTarget')
export class YJSyncContentSizeToTarget extends Component {
    @property(Node)
    target: Node = null;
    @property
    offset: math.Size = math.size();
    @property({ displayName: '检测自己', tooltip: '为勾选后将自己的size同步到target，否则将target的size同步到自己' })
    checkSelf: boolean = false;
    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    private _selfSize: math.Size;

    protected onEnable(): void {
        // this.schedule(this.check, .2, macro.REPEAT_FOREVER);
        if (this.checkSelf)
            this.node.on(Node.EventType.SIZE_CHANGED, this.check, this);
        else this.target?.on(Node.EventType.SIZE_CHANGED, this.check, this);
    }

    protected onDisable(): void {
        // this.unschedule(this.check);
        if (this.checkSelf)
            this.node.targetOff(this);
        else this.target?.targetOff(this);
    }

    private check() {
        if (!this.target || !isValid(this?.node)) {
            this.unschedule(this.check);
            return;
        }
        if (this.checkSelf) {
            let size = no.size(this.node);
            if (this._selfSize && this._selfSize.equals(size)) return;
            this._selfSize = size.clone();
            let scale = this.node.scale.clone();
            size.width *= scale.x;
            size.height *= scale.y;
            size.width += this.offset.width;
            size.height += this.offset.height;
            this.target.getComponent(UITransform).setContentSize(size);
            no.EventHandlerInfo.execute(this.onChange);
        } else {
            let tSize = this.target.getComponent(UITransform).contentSize.clone();
            let scale = this.target.scale.clone();
            tSize.width *= scale.x;
            tSize.height *= scale.y;
            tSize.width += this.offset.width;
            tSize.height += this.offset.height;
            let size = this.node.getComponent(UITransform).contentSize;
            if (!size.equals(tSize)) {
                this.node.getComponent(UITransform).setContentSize(tSize);
                no.EventHandlerInfo.execute(this.onChange);
            }
        }
    }
}
