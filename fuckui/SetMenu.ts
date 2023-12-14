import { ccclass, requireComponent } from '../../NoUi3/yj';
import { YJMenu } from '../widget/menu/YJMenu';
import { FuckUi } from './FuckUi';

/**
 * 动态创建页签
 * Author mqsy_yj
 * DateTime Thu Aug 24 2023 16:31:13 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetMenu')
@requireComponent(YJMenu)
export class SetMenu extends FuckUi {

    onDisable() {
        this.a_clearData();
    }

    protected onDataChange(data: any) {
        this.getComponent(YJMenu).createMenu(data);
    }
}
