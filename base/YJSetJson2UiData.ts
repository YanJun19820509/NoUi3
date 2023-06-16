
import { ccclass, property, menu, Component, Node } from '../yj';
import { FuckUi } from '../fuckui/FuckUi';

/**
 * Predefined variables
 * Name = YJSetJson2UiData
 * DateTime = Fri Jan 14 2022 18:09:09 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJSetJson2UiData.ts
 * FileBasenameNoExtension = YJSetJson2UiData
 * URL = db://assets/Script/NoUi3/base/YJSetJson2UiData.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('Json2UiDataInfo')
export class Json2UiDataInfo {
    @property({ multiline: true })
    json: string = '';
    @property(FuckUi)
    ui: FuckUi = null;
}
/**
 * 将json string转any,并在start时给fuckui赋值
 */
@ccclass('YJSetJson2UiData')
@menu('NoUi/base/YJSetJson2UiData(json转ui data:string)')
export class YJSetJson2UiData extends Component {
    @property(Json2UiDataInfo)
    infos: Json2UiDataInfo[] = [];
    @property
    autoSet: boolean = true;

    start() {
        if (!this.autoSet) return;
        for (let i = 0, n = this.infos.length; i < n; i++) {
            this.a_set(i);
        }
    }

    public a_set(idx: string | number) {
        let info = this.infos[Number(idx)];
        if (!info || info.json == '' || !info.ui) return;
        info.ui.setData(info.json.replace(/\n/g, '').replace(/\'/g, '\"'));
    }
}