
import { _decorator, PageView } from './yj';
import { FuckUi } from './FuckUi';
const { ccclass, property, menu } = _decorator;

/**
 * Predefined variables
 * Name = SetPageCurrentShow
 * DateTime = Mon Jan 17 2022 12:01:36 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetPageCurrentShow.ts
 * FileBasenameNoExtension = SetPageCurrentShow
 * URL = db://assets/Script/NoUi3/fuckui/SetPageCurrentShow.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/en/
 *
 */

@ccclass('SetPageCurrentShow')
@menu('NoUi/ui/SetPageCurrentShow(设置当前显示的页面:number)')
export class SetPageCurrentShow extends FuckUi {

    @property(PageView)
    pageView: PageView = null;

    protected onDataChange(data: any) {
        this.pageView?.setCurrentPageIndex(Number(data));
    }
}
