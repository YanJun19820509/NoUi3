
import { _decorator, Sprite } from 'cc';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
const { ccclass, property, menu, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetGray
 * DateTime = Mon Jan 17 2022 10:47:00 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetGray.ts
 * FileBasenameNoExtension = SetGray
 * URL = db://assets/Script/NoUi3/fuckui/SetGray.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetGray')
@menu('NoUi/ui/SetGray(设置灰态:bool)')
@requireComponent(SetEffect)
export class SetGray extends FuckUi {

    @property({ displayName: '默认置灰' })
    autoGray: boolean = false;
    @property({ displayName: '取反' })
    reverse: boolean = false;
    @property({ displayName: '影响子节点' })
    recursive: boolean = false;

    onLoad() {
        super.onLoad();
        this.autoGray && !this.dataSetted && this.setGray(true);
    }

    protected onDataChange(data: any) {
        data = Boolean(data);
        if (this.reverse) data = !data;
        this.setGray(data);
    }

    private setGray(v: boolean) {
        let setEffect = this.getComponent(SetEffect) || this.addComponent(SetEffect);
        setEffect.setData(JSON.stringify(v ?
            {
                path: 'NoUi3/effect/gray',
                defines: {
                    IS_GRAY: v
                }
            } : {}
        ));
        if (this.recursive) {
            this.node.children.forEach(child => {
                (child.getComponent(SetGray) || child.addComponent(SetGray)).setData(JSON.stringify(v));
            });
        }
    }
}
