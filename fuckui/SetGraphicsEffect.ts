
import { _decorator, Component, Node, Graphics, Material } from 'cc';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';
const { ccclass, property, requireComponent } = _decorator;

/**
 * Predefined variables
 * Name = SetGraphicsEffect
 * DateTime = Wed May 25 2022 09:28:48 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetGraphicsEffect.ts
 * FileBasenameNoExtension = SetGraphicsEffect
 * URL = db://assets/NoUi3/fuckui/SetGraphicsEffect.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * data:{
 * path?:'filepath',
 * defines?:{key:boolean},
 * properties?:{key:any}
 * },
 * 
 * 用于graphics设置效果
 */
@ccclass('SetGraphicsEffect')
@requireComponent(Graphics)
export class SetGraphicsEffect extends SetEffect {

    protected onDataChange(data: any) {
        if (!this._renderComp) {
            this._renderComp = this.getComponent(Graphics);
            if (!this._renderComp) return;
        }
        let { path, properties, defines }: { path: string, properties: {}, defines: {} } = data;
        this.setMaterial(path, defines, properties);
    }

    protected setMaterial(path: string, defines: any, properties: any) {
        if (this._renderComp.customMaterial && (!path || this._renderComp.customMaterial?.effectName == `../${path}`))
            this.setProperties(this._renderComp.customMaterial, defines, properties);
        else if (path)
            no.assetBundleManager.loadEffect(path, item => {
                const material = new Material();
                material.initialize({
                    effectAsset: item
                });
                this._renderComp.customMaterial = material;
                this.setProperties(this._renderComp.customMaterial, defines, properties);
            });
        else this.reset();
    }
}
