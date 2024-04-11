import { BitmapFont, ccclass, property, requireComponent } from '../../NoUi3/yj';
import { no } from '../no';
import { LoadAssetsInfo } from '../types';
import { YJBitmapFont } from '../widget/bmfont/YJBitmapFont';
import { FuckUi } from './FuckUi';

/**
 * 根据状态设置不同的bitmapfont
 * Author mqsy_yj
 * DateTime Mon Aug 21 2023 09:33:19 GMT+0800 (中国标准时间)
 * data:string|number
 */

@ccclass('SetBitmapFontWithStateInfo')
export class SetBitmapFontWithStateInfo extends LoadAssetsInfo {
    @property
    state: string = '';
    @property({ type: BitmapFont })
    public get bmFont(): BitmapFont {
        return null;
    }

    public set bmFont(v: BitmapFont) {
        if (v) {
            this.assetName = v.name;
            this.assetUuid = v.uuid;
            no.getAssetUrlInEditorMode(this.assetUuid, url => {
                this.path = url;
            });
        }
    }
}

@ccclass('SetBitmapFontWithState')
@requireComponent(YJBitmapFont)
export class SetBitmapFontWithState extends FuckUi {
    @property({ type: SetBitmapFontWithStateInfo })
    states: SetBitmapFontWithStateInfo[] = [];

    /**如果没需求可以不实现 */
    // onLoad() {
    //     super.onLoad();
    //     // todo 自己的逻辑
    // }

    protected onDataChange(data: any) {
        const info = no.itemOfArray<SetBitmapFontWithStateInfo>(this.states, String(data), 'state');
        if (info) {
            this.getComponent(YJBitmapFont).setBitmapFont(info.assetUuid, info.path);
        }
    }

    /**如果没需求可以不实现 */
    // public a_setEmpty(): void {

    // }
}
