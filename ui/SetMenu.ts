import { ccclass, requireComponent } from '../../NoUi3/yj';
import { YJMenu } from '../widget/menu/YJMenu';
import { HackUi } from './HackUi';

/**
 * 动态创建页签
 * Author mqsy_yj
 * DateTime Thu Aug 24 2023 16:31:13 GMT+0800 (中国标准时间)
 *
 */

@ccclass('SetMenu')
@requireComponent(YJMenu)
export class SetMenu extends HackUi {

    /**
     * 数据变更时的回调方法
     * @param data - 菜单配置数据，应为数组格式，每个元素包含菜单项配置
     *        @example 
     *        [
     *          { title: '首页', redHintKeys?: 'home' },
     *          { title: '设置', redHintKeys?: 'settings' }
     *        ]
     * @description 根据传入的数据动态创建菜单项，数据格式需符合YJMenu组件要求
     * 会完全重建菜单，适合数据量较小的场景（建议不超过50个菜单项）
     */
    protected onDataChange(data: any) {
        // 获取挂载的YJMenu组件实例
        const menuComponent = this.getComponent(YJMenu);
        // 调用菜单创建方法，传入格式化后的配置数据
        menuComponent.createMenu(data);
    }
}
