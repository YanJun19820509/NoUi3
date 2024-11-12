
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
    /** 目标节点 */
    @property(Node)
    target: Node = null;

    /** 尺寸偏移量 */
    @property
    offset: Size = math.size();

    /** 是否检测自己的尺寸变化
     * 为true时将自己的size同步到target
     * 为false时将target的size同步到自己
     */
    @property({ displayName: '检测自己', tooltip: '为勾选后将自己的size同步到target，否则将target的size同步到自己' })
    checkSelf: boolean = false;

    /** 尺寸变化时触发的事件列表 */
    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    /** 是否同步缩放 */
    @property({ displayName: '是否同步scale' })
    syncScale: boolean = true;

    /** 测试属性，设置为true时触发check */
    @property({ displayName: '测试' })
    public get test(): boolean {
        return false;
    }

    public set test(v: boolean) {
        if (v) {
            this.check()
        }
    }

    /** 组件启用时注册尺寸变化监听 */
    protected onEnable(): void {
        if (this.checkSelf)
            this.node.on(Node.EventType.SIZE_CHANGED, this.check, this);
        else this.target?.on(Node.EventType.SIZE_CHANGED, this.check, this);
    }

    /** 组件禁用时移除尺寸变化监听 */
    protected onDisable(): void {
        if (this.checkSelf)
            this.node.targetOff(this);
        else this.target?.targetOff(this);
    }

    /** 检查并同步尺寸 */
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

    /**
     * 同步节点尺寸
     * @param from 源节点
     * @param to 目标节点
     */
    private syncSize(from: Node, to: Node) {
        let size = no.size(from);
        let scale = no.scale(from);
        if (this.syncScale) {
            size.width *= scale.x;
            size.height *= scale.y;
        }
        size.width += this.offset.width;
        size.height += this.offset.height;
        no.size(to, size);
        no.EventHandlerInfo.execute(this.onChange);
    }

    /**
     * 设置节点尺寸并触发同步
     * @param size 要设置的尺寸
     */
    public setSize(size: Size) {
        no.size(this.node, size);
        this.check();
    }
}
