import { YJPanel } from '../../base/node/YJPanel';
import { YJWindowManager } from '../../base/node/YJWindowManager';
import { YJDataWork } from '../../base/YJDataWork';
import { YJFitScreen } from '../../base/YJFitScreen';
import { no } from '../../no';
import { addPanelTo, panelPrefabPath } from '../../types';
import { ccclass, property, Node } from '../../yj';

/**
 * 跑马灯
 * Author mqsy_yj
 * DateTime Tue Dec 19 2023 17:52:00 GMT+0800 (中国标准时间)
 *
 */

@ccclass('YJScrollMessage')
@addPanelTo('mess')
@panelPrefabPath('db://assets/NoUi3/widget/scrollMessage/scroll_message.prefab')
export class YJScrollMessage extends YJPanel {
    @property(YJDataWork)
    dataWork: YJDataWork = null;
    @property(Node)
    container: Node = null;
    @property(Node)
    msgItem: Node = null;
    @property({ displayName: '每秒移动距离' })
    speed: number = 100;

    private _list: string[] = [];
    private containerWidth: number;
    private startX: number;
    private moving: boolean = false;

    private static _ins: YJScrollMessage;

    /**
     * 
     * @param msgs 消息
     * @param top 是否插入前排
     */
    public static show(msgs: string | string[], top = false) {
        if (!this._ins) {
            YJWindowManager.createPanel<YJScrollMessage>(YJScrollMessage, 'mess', null, panel => {
                panel.setInfo(msgs, top);
            });
        } else this._ins.setInfo(msgs, top);
    }

    onLoad() {
        YJScrollMessage._ins = this;
        this.containerWidth = no.width(this.container) / 2;
        this.startX = YJFitScreen.getVisibleSize().width / 2;
    }

    onDestroy() {
        YJScrollMessage._ins = null;
    }

    private setInfo(msgs: string | string[], top: boolean) {
        if (!top)
            this._list = this._list.concat(msgs);
        else {
            this._list = [].concat(msgs, this._list);
        }
        if (this.moving) return;
        this.moving = true;
        this.dataWork.setValue('show', true);
        this.setMsgItem();
    }

    private setMsgItem() {
        no.x(this.msgItem, this.startX);
        const msg = this._list.shift();
        if (!msg) {
            this.moving = false;
            this.dataWork.setValue('show', false);
            return;
        }
        this.msgItem.getComponent(YJDataWork).data = { msg: msg };
        this.scheduleOnce(this.move, .1);
    }

    private move() {
        const end = -no.width(this.msgItem) - this.containerWidth,
            n = -end / this.speed;
        this.msgItem.getComponent(YJDataWork).setValue('move', {
            duration: n,
            to: 1,
            props: {
                pos: [end, 0]
            }
        });
        this.scheduleOnce(this.setMsgItem, n + .1);
    }
}
no.addToWindowForDebug('YJScrollMessage', YJScrollMessage);