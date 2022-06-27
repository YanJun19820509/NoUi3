
import { _decorator, Component, Node, Material, RenderComponent } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJSetMaterial
 * DateTime = Mon Jun 27 2022 17:43:43 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetMaterial.ts
 * FileBasenameNoExtension = YJSetMaterial
 * URL = db://assets/NoUi3/effect/YJSetMaterial.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('YJSetMaterial')
@executeInEditMode()
export class YJSetMaterial extends Component {

    @property(Material)
    commonMaterial: Material = null;
    @property
    autoSet: boolean = false;

    //////////////EDITOR/////////////
    update() {
        if (!EDITOR || !this.autoSet || !this.commonMaterial) return;
        this.autoSet = false;
        let renderComps = this.getComponentsInChildren(RenderComponent);
        renderComps.forEach(comp => {
            if (this.commonMaterial != comp.customMaterial)
                comp.customMaterial = this.commonMaterial;
        });
    }
}
