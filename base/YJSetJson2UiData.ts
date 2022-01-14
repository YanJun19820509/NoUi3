
import { _decorator, Component, Node } from 'cc';
import { FuckUi } from '../fuckui/FuckUi';
const { ccclass, property, menu } = _decorator;

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

    start() {
        this.infos.forEach(info => {
            if (info.json == '' || !info.ui) return;
            let data = JSON.parse(info.json);
            info.ui.setData(data);
        });
    }
}