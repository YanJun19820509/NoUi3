
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
    @property()
    condition: string = '';

    @property({ type: Node, displayName: '显示节点' })
    nodes: Node[] = [];

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
        this.infos.forEach(info => {
            info.show(info.condition == data);
        });
    }
}
