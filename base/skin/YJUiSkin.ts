
import { _decorator, Component, Node, Sprite } from 'cc';
import { SetShader } from '../../fuckui/SetShader';
import { no } from '../../no';
const { ccclass, property, menu, requireComponent, executeInEditMode } = _decorator;

/**
 * Predefined variables
 * Name = YJUiSkin
 * DateTime = Fri Jan 14 2022 17:25:21 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJUiSkin.ts
 * FileBasenameNoExtension = YJUiSkin
 * URL = db://assets/Script/NoUi3/base/skin/YJUiSkin.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

// 皮肤更换方案设计：不同皮肤资源按包管理，皮肤包下的目录结构及资源名称都一致，
// 通过切换包名来实现皮肤的更替，由皮肤组件管理的Sprite不要默认加载资源

/** 皮肤管理器 */
export class YJUiSkinManager {
    private static _currentSkinBundle: string = '';

    /**当前皮肤包名 */
    public static get currentSkinBundle(): string {
        return this._currentSkinBundle;
    }

    /**设置皮肤包名，同时通知皮肤组件加载新资源 */
    public static set currentSkinBundle(name: string) {
        if (this._currentSkinBundle == name) return;
        no.assetBundleManager.loadBundle(name, () => {
            this._currentSkinBundle = name;
            no.evn.emit('skin_bundle_change', name);
        });
    }
}

@ccclass('YJUiSkin')
@requireComponent(Sprite)
@menu('NoUi/skin/YJSkin(皮肤组件，自动更换图片)')
@executeInEditMode()
export class YJUiSkin extends Component {
    @property({ tooltip: '图片路径，从包的一级子目录开始，不含包名' })
    path: string = '';

    protected onLoad(): void {
        this.onChange();
    }

    protected onEnable(): void {
        no.evn.on('skin_bundle_change', this.onChange, this);
    }

    protected onDisable(): void {
        no.evn.targetOff(this);
    }

    private onChange() {
        if (YJUiSkinManager.currentSkinBundle == '') return;
        no.assetBundleManager.loadSprite(YJUiSkinManager.currentSkinBundle + '/' + this.path, (sf) => {
            let sprite = this.getComponent(Sprite);
            no.assetBundleManager.decRef(sprite.spriteFrame);
            sprite.spriteFrame = null;
            sprite.spriteFrame = sf;
            this.checkShader();
        });
    }

    private checkShader() {
        this.scheduleOnce(() => {
            this.getComponent(SetShader)?.work();
        }, 0);
    }
}
