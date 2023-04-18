
import { _decorator, Component, Node, EffectAsset } from 'cc';
import { EDITOR } from 'cc/env';
import { SetEffect } from '../../fuckui/SetEffect';
import { no } from '../../no';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJSetShaderProperties
 * DateTime = Fri Jan 14 2022 16:37:20 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetShaderProperties.ts
 * FileBasenameNoExtension = YJSetShaderProperties
 * URL = db://assets/Script/NoUi3/base/shader/YJSetShaderProperties.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('DefineInfo')
export class DefineInfo {
    @property
    type: string = '';
    @property
    isWork: boolean = false;
}

@ccclass('PropertyInfo')
export class PropertyInfo {
    @property
    type: string = '';
    @property({ step: 0.01 })
    value: number = 0.0;
}

@ccclass('YJSetShaderProperties')
@menu('NoUi/shader/YJSetShaderProperties(设置shader属性)')
@requireComponent(SetEffect)
@executeInEditMode()
export class YJSetShaderProperties extends Component {

    @property({ type: EffectAsset, editorOnly: true })
    effectAsset: EffectAsset = null;
    @property({ readonly: true })
    path: string = '';

    @property(DefineInfo)
    defines: DefineInfo[] = [];

    @property(PropertyInfo)
    properties: PropertyInfo[] = [];

    onEnable() {
        this.setEffect();
    }

    private setEffect() {
        if (this.path == '') return;
        let ss = this.getComponent(SetEffect);
        let properties = {};
        this.properties.forEach(p => {
            properties[p.type] = p.value;
        });
        let defines = {};
        this.defines.forEach(d => {
            defines[d.type] = d.isWork;
        });
        let d = {
            path: this.path,
            properties: properties,
            defines: defines
        };
        no.log(d);
        ss.setData(no.jsonStringify(d));
    }

    ////////////EDITOR MODE//////////////////////
    update() {
        if (EDITOR) {
            if (this.effectAsset != null) {
                this.setUrl();
            }
        }
    }

    private async setUrl() {
        let url = await no.getAssetUrlInEditorMode(this.effectAsset._uuid);
        this.path = url.replace('db://assets/', '').replace('.effect', '');
        this.effectAsset = null;
    }
}
