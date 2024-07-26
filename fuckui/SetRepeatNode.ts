import { ccclass, property, Node, instantiate } from '../../NoUi3/yj';
import { no } from '../no';
import { FuckUi } from './FuckUi';

/**
 * 设置重复节点，如星级展示
 * Author mqsy_yj
 * DateTime Mon Jul 22 2024 17:24:07 GMT+0800 (中国标准时间)
 * data--{count:number,max:number,show:string,fill:string}
 * count--重复数量, max--最大数量，show--重复节点显示图片名, fill-填充节点显示图片名
 */

@ccclass('SetRepeatNode')
export class SetRepeatNode extends FuckUi {
    @property(Node)
    tempNode: Node = null;

    protected onDataChange(data: any) {
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
