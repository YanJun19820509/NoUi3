import { ccclass, property, Node, instantiate, SpriteFrame } from '../../NoUi3/yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * 设置重复节点，如星级展示
 * Author mqsy_yj
 * DateTime Mon Jul 22 2024 17:24:07 GMT+0800 (中国标准时间)
 * data--number | {count:number,max:number,show:string,fill:string} 
 * count--重复数量, max--最大数量，show--重复节点显示图片名, fill-填充节点显示图片名
 */

@ccclass('FillSpriteFrameInfo')
export class FillSpriteFrameInfo {
    @property(SpriteFrame)
    public get fill(): SpriteFrame {
        return null;
    }

    public set fill(v: SpriteFrame) {
        if (v) {
            this.assetUuid = v.uuid;
            this.assetName = v.name;
        }
    }
    @property({ readonly: true })
    assetName: string = '';
    @property({ readonly: true })
    assetUuid: string = '';
}

@ccclass('SetRepeatNode')
export class SetRepeatNode extends FuckUi {
    @property(Node)
    tempNode: Node = null;
    @property({ displayName: '类似星级样式' })
    starLike: boolean = false;
    @property({ displayName: '最多显示数量', visible() { return this.starLike; } })
    max: number = 5;
    @property({ type: FillSpriteFrameInfo, displayName: ' 显示图片', visible() { return this.starLike; } })
    show: FillSpriteFrameInfo[] = [];
    @property({ type: FillSpriteFrameInfo, displayName: '填充图片', visible() { return this.starLike; } })
    fill: FillSpriteFrameInfo[] = [];


    protected onDataChange(data: any) {
        if (typeof data === 'number') {
            this.setWithNumber(data);
        } else if (typeof data === 'object') {
            this.setWithObject(data);
        }
    }

    private setWithNumber(star: number) {
        const count = star <= this.max ? star : (star - 5),
            idx = Math.floor(star / (this.max + 1)),
            show = this.show[idx].assetName,
            fill = this.fill[idx]?.assetName || 'null';
        this.setWithObject({ count, max: this.max, show, fill });
    }

    private setWithObject(data: { count: number, max: number, show: string, fill: string }) {
        const { count, max, show, fill }: { count: number, max: number, show: string, fill: string } = data;
        if (!this.tempNode) {
            no.err('YJRepeatBox tempNode is null!');
            return;
        }
        for (let i = 0; i < max; i++) {
            let item = this.node.children[i];
            if (!item) {
                item = instantiate(this.tempNode);
                if (item) {
                    item.parent = this.node;
                    item.active = true;
                }
            }
            item.getComponent('SetSpriteFrameInSampler2D')['setData'](JSON.stringify(i < count ? show : fill));
        }
    }
}
