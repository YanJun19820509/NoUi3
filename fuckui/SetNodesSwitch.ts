
import { _decorator, Component, Node } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

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

    public checkShow(v: string): boolean {
        if (!this.conditions) this.conditions = this.condition.split(',');
        return this.conditions.indexOf(v) != -1;
    }

    public show(v: boolean) {
        this.nodes.forEach(node => {
            node.active = v;
        });
    }
}
@ccclass('SetNodesSwitch')
@menu('NoUi/ui/SetNodesSwitch(设置显隐切换:string)')
export class SetNodesSwitch extends FuckUi {

    @property(SwitchInfo)
    infos: SwitchInfo[] = [];

    protected onDataChange(data: any) {
        data = String(data);
        let showIdx = 0;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            let info = this.infos[i];
            if (info.checkShow(data)) showIdx = i;
            else (info.show(false));
        }
        this.infos[showIdx].show(true);
    }
}
