
import { ccclass, property, requireComponent, disallowMultiple, EDITOR, MeshRender, SpriteFrame, v4 } from '../../yj';
import { YJLoadAssets3D } from '../editor/YJLoadAssets3D';
import { no } from '../../no';
import { YJVertexColorTransition } from '../../effect/YJVertexColorTransition';
import { FuckUi } from '../../fuckui/FuckUi';

/**
 * Predefined variables
 * Name = SetSpriteFrameInSampler3D
 * DateTime = Tue Nov 15 2022 22:25:51 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetSpriteFrameInSampler3D.ts
 * FileBasenameNoExtension = SetSpriteFrameInSampler3D
 * URL = db://assets/Script/NoUi3/fuckui/SetSpriteFrameInSampler3D.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * 用于设置材质中挂载的纹理采样的区域
 * data:string,为指定spriteFrame的名称
 */

@ccclass('SetSpriteFrameInSampler3D')
@requireComponent([MeshRender, YJVertexColorTransition])
@disallowMultiple()
export class SetSpriteFrameInSampler3D extends FuckUi {
    @property({ type: SpriteFrame })
    public get spriteFrame(): SpriteFrame {
        return null;
    }

    public set spriteFrame(v: SpriteFrame) {
        if (v) {
            this.defaultName = v.name;
        } else {
            this.defaultName = '';
        }
    }
    @property
    defaultName: string = '';
    @property({ type: YJLoadAssets3D, readonly: true })
    loadAsset: YJLoadAssets3D = null;

    private lastDefine: string;

    private defineIndex: number = 0;

    onLoad() {
        super.onLoad();
        this.setDynamicAtlas();
    }

    public setDynamicAtlas() {
        if (EDITOR) {
            if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets3D);
        }
    }

    start() {
        if (EDITOR) return;
        if (this.defaultName) this.setSpriteFrame(this.defaultName);
    }

    onDataChange(data: any) {
        let name = String(data).split('/').pop();
        this.setSpriteFrame(name);
    }
    private _num = 0;
    public setSpriteFrame(name: string) {
        if (!this.enabled) return;
        if (!this.loadAsset) {
            return;
        }
        const [i, spriteFrame] = this.loadAsset.getSpriteFrameInAtlas(name);
        if (!spriteFrame) {
            if (this._num < 10) {
                this._num++;
                this.scheduleOnce(() => {
                    this.setSpriteFrame(name);
                }, .1);
            } else {
                no.err('setSpriteFrame3d not get', name);
            }
            return;
        }
        this.setSpriteEnable(true);
        this.setTilingOffset(spriteFrame.uv);
        let t = `${this.defineIndex}-${i + 1}00`;
        const defines: any = {};
        defines[t] = true;
        if (this.lastDefine && this.lastDefine != t) {
            defines[this.lastDefine] = false;
        }
        this.lastDefine = t;
        this.getComponent(YJVertexColorTransition).setEffect(defines);
    }

    private setTilingOffset(uv: number[]) {
        const material = this.getComponent(MeshRender).getMaterialInstance(0);
        if (!no.materialHasProperty(material, 'tilingOffset')) return;
        let tilingOffset = v4(uv[2] - uv[0], uv[1] - uv[5], uv[0], uv[5]);
        material.setProperty('tilingOffset', tilingOffset, 0);
    }

    public a_setEmpty(): void {
        this.getComponent(MeshRender).materials = [];
    }

    public resetSprite() {
        this.setSpriteEnable(true);
        if (this.defaultName) this.setSpriteFrame(this.defaultName);
    }

    public removeSprite() {
        this.getComponent(MeshRender).materials = [];
        this.setSpriteEnable(false);
    }


    public setSpriteEnable(v: boolean) {
        if (!this.enabled) return;
        this.getComponent(MeshRender).enabled = v;
    }
}