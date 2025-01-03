
import { ccclass, property, menu, requireComponent, executeInEditMode, EDITOR, UIRenderer, Sprite } from '../yj';
import { FuckUi } from './FuckUi';
import { SetEffect } from './SetEffect';


@ccclass('SetAlphaMask')
@menu('NoUi/ui/SetAlphaMask(设置半透遮罩:bool)')
@requireComponent(SetEffect)
@executeInEditMode()
export class SetAlphaMask extends FuckUi {

    @property({ displayName: '默认置灰' })
    autoGray: boolean = false;
    @property({ displayName: '取反' })
    reverse: boolean = false;
    @property({ displayName: '影响子节点' })
    recursive: boolean = false;
    @property
    autoSetChildren: boolean = false;

    onLoad() {
        super.onLoad();
        if (EDITOR) return;
        this.autoGray && !this.dataSetted && this.SetAlphaMask(true);
    }

    protected onDataChange(data: any) {
        data = Boolean(data);
        if (this.reverse) data = !data;
        this.SetAlphaMask(data);
    }

    private _num = 30;
    private SetAlphaMask(v: boolean) {
        let a = this.getComponent(UIRenderer);
        if (a) {
            if (!a.customMaterial) {
                if (this._num > 0) {
                    this._num--;
                    this.scheduleOnce(() => {
                        this.SetAlphaMask(v);
                    });
                    return;
                }
                this.SetAlphaMaskNoEffect(v);
            } else {
                let setEffect = this.getComponent(SetEffect) || this.addComponent(SetEffect);
                setEffect.setData(
                    {
                        defines: {
                            ['0-10']: v
                        }
                    }
                );
            }
        }
        if (this.recursive) {
            this.getComponentsInChildren(UIRenderer).forEach(child => {
                if (a?.uuid == child.uuid) return;
                child.getComponent(SetAlphaMask)?.setData(v);
            });
        }
    }

    private SetAlphaMaskNoEffect(v: boolean) {
        const a = this.getComponent(Sprite);
        if (!a) return;
        a.grayscale = v;
    }

    update() {
        if (!EDITOR) return;
        if (!this.autoSetChildren) return;
        this.autoSetChildren = false;

        if (this.recursive) {
            this.getComponentsInChildren(UIRenderer).forEach(child => {
                const a = (child.getComponent(SetAlphaMask) || child.addComponent(SetAlphaMask));
            });
        }
    }
}
