import { YJUIAnimationEffect } from '../base/ani/YJUIAnimationEffect';
import { no } from '../no';
import { ccclass, property, menu, Node, isValid } from '../yj';
import { FuckUi } from './FuckUi';

/**
 * Predefined variables
 * Name = SetNodesSwitch
 * DateTime = Mon Jan 17 2022 11:58:16 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetNodesSwitch.ts
 * FileBasenameNoExtension = SetNodesSwitch
 * URL = db://assets/Script/NoUi3/fuckui/SetNodesSwitch.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */
@ccclass("SwitchInfo")
export class SwitchInfo {
    @property({ displayName: '条件', tooltip: '多条件用,分隔' })
    condition: string = '';

    @property({ type: Node, displayName: '显示节点' })
    nodes: Node[] = [];

    private conditions: string[];

    public checkShow(v: string) {
        if (!this.conditions) this.conditions = this.condition.split(',');
        let a = this.conditions.indexOf(v) != -1;
        this.nodes.forEach(node => {
            if (!isValid(node)) return;
            if (node['__origin_x__'] == null) {
                node['__origin_x__'] = no.x(node);
            }
            no.visibleByOpacity(node, a);
            no.x(node, !a ? 20000 : node['__origin_x__']);
        });
    }

    public init() {
        this.nodes.forEach(node => {
            no.visibleByOpacity(node, false);
        });
    }
}
@ccclass('SetNodesSwitch')
@menu('NoUi/ui/SetNodesSwitch(设置显隐切换:string)')
export class SetNodesSwitch extends FuckUi {

    @property(SwitchInfo)
    infos: SwitchInfo[] = [];

    @property({ displayName: '播放动效', type: YJUIAnimationEffect, tooltip: '没有指定则不播放动效' })
    uiAnim: YJUIAnimationEffect = null;

    private _data: string;
    protected onDataChange(data: any) {
        this._data = String(data);
        if (this.uiAnim) this.uiAnim.a_play();
        else this.check();
    }

    public a_AnimationEffectCallback() {
        this.check();
    }

    private check() {
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let info = this.infos[i];
            info.checkShow(this._data);
        }
    }
}
