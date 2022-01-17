
import { _decorator, Material, RenderComponent } from 'cc';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

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
export class SetGray extends FuckUi {

    @property(Material)
    grayMaterial: Material = null;
    @property({ displayName: '默认置灰' })
    autoGray: boolean = false;
    @property({ displayName: '取反' })
    reverse: boolean = false;

    private _normalMaterial: Material;

    onLoad() {
        this._normalMaterial = this.getComponent(RenderComponent).getMaterial(0);
    }

    protected onDataChange(data: any) {
        data = Boolean(data);
        if (this.reverse) data = !data;
        let m = data ? this.grayMaterial : this._normalMaterial;
        this.getComponent(RenderComponent).setMaterial(m, 0);
    }
}
