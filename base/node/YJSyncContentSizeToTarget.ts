
import { ccclass, property, Component, Node, math, isValid, Size } from '../../yj';
import { no } from '../../no';

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
    offset: Size = math.size();
    @property({ displayName: '检测自己', tooltip: '为勾选后将自己的size同步到target，否则将target的size同步到自己' })
    checkSelf: boolean = false;
    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    @property({ displayName: '测试' })
    public get test(): boolean {
        return false;
    }

    public set test(v: boolean) {
        if (v) {
            this.check()
        }
    }

    protected onEnable(): void {
        if (this.checkSelf)
            this.node.on(Node.EventType.SIZE_CHANGED, this.check, this);
        else this.target?.on(Node.EventType.SIZE_CHANGED, this.check, this);
    }

    protected onDisable(): void {
        if (this.checkSelf)
            this.node.targetOff(this);
        else this.target?.targetOff(this);
    }

    private check() {

        if (!this.target || !isValid(this?.node)) {
            return;
        }
        if (this.checkSelf) {
            this.syncSize(this.node, this.target);
        } else {
            this.syncSize(this.target, this.node);
        }
    }

    private syncSize(from: Node, to: Node) {
        let size = no.size(from);
        let scale = no.scale(from);
        size.width *= scale.x;
        size.height *= scale.y;
        size.width += this.offset.width;
        size.height += this.offset.height;
        no.size(to, size);
        no.EventHandlerInfo.execute(this.onChange);
    }
}
