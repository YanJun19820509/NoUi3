
import { _decorator, Component, Node, instantiate, Toggle } from 'cc';
import { YJDataWork } from '../../base/YJDataWork';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJIndicator
 * DateTime = Tue Nov 29 2022 12:24:26 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJIndicator.ts
 * FileBasenameNoExtension = YJIndicator
 * URL = db://assets/NoUi3/widget/indicator/YJIndicator.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 导航标签
 * data:{num?: number, cur?: number}
 * num是标签总数，cur当前高亮下标
 */
@ccclass('YJIndicator')
export class YJIndicator extends YJDataWork {
    @property({ type: Node, displayName: '标签模板' })
    template: Node = null;
    @property({ type: Node, displayName: '容器' })
    container: Node = null;

    //子类实现
    protected afterInit() {
        if (!this.template || !this.container) return;
        let { num, cur }: { num?: number, cur?: number } = this.data;
        if (num != undefined) this.createItem(num);
        if (cur != undefined) this.setCur(cur);
    }

    private createItem(n: number) {
        let l = this.container.children.length;
        for (let i = l; i < n; i++) {
            let c = instantiate(this.template);
            c.parent = this.container;
            c.active = true;
        }
    }

    private setCur(idx: number) {
        let arr = this.container.children;
        arr.forEach((a, i) => {
            a.getComponent(Toggle).isChecked = i == idx;
        });
    }
}
