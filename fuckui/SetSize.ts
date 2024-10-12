
import { ccclass, menu, property, Node, Size, size, v3, NodeEventType } from '../yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetSize
 * DateTime = Mon Jan 17 2022 14:20:47 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSize.ts
 * FileBasenameNoExtension = SetSize
 * URL = db://assets/Script/NoUi3/fuckui/SetSize.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 * 设置宽高，支持子节点尺寸超过最大尺寸自动缩小，支持同步子节点尺寸
 */

@ccclass('SetSize')
@menu('NoUi/ui/SetSize(设置宽高:object)')
export class SetSize extends FuckUi {
    @property
    checkMaxSize: boolean = false;
    @property({ tooltip: '最大尺寸，超过该尺寸会缩小，0表示不限制', visible() { return this.checkMaxSize; } })
    maxSize: Size = size();
    @property({ tooltip: '是否同步尺寸', visible() { return !this.checkMaxSize; } })
    syncSize: boolean = false;

    onLoad() {
        super.onLoad();
        if (this.checkMaxSize) {
            this.checkMaxSize = this.maxSize.width > 0 && this.maxSize.height > 0;
        }
        if (this.checkMaxSize || this.syncSize) {
            this.node.on(NodeEventType.CHILD_ADDED, this._childAdded, this);
            this.node.on(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
        }
    }

    onDestroy() {
        if (this.checkMaxSize || this.syncSize) {
            this.node.off(NodeEventType.CHILD_ADDED, this._childAdded, this);
            this.node.off(NodeEventType.CHILD_REMOVED, this._childRemoved, this);
        }
    }

    protected onDataChange(data: any) {
        let a = [];
        for (let k in data) {
            a.push(data[k]);
        }
        no.width(this.node, a[0]);
        no.height(this.node, a[1]);
    }

    private checkSize() {
        let width = 0, height = 0;
        for (let i = 0, n = this.node.children.length; i < n; i++) {
            const child = this.node.children[i];
            const s = no.size(child);
            width = Math.max(width, s.width);
            height = Math.max(height, s.height);
        }

        if (this.checkMaxSize) {
            const wMax = this.maxSize.width,
                hMax = this.maxSize.height;
            let s = 1;
            if (width > wMax) {
                s = wMax / width;
            } else if (height > hMax) {
                s = hMax / height
            }
            if (s < 1) {
                no.scale(this.node, v3(s, s, 1));
            }
        } else if (this.syncSize) {
            no.size(this.node, size(width, height));
        }
    }

    protected _childAdded(child: Node) {
        child.on(NodeEventType.SIZE_CHANGED, this.checkSize, this);
        this.checkSize();
    }

    protected _childRemoved(child: Node) {
        child.off(NodeEventType.SIZE_CHANGED, this.checkSize, this);
    }
}
