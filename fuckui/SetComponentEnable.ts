
import { ccclass, property, executeInEditMode } from '../yj';
import { SetComponentPropertyValue } from './SetComponentPropertyValue';

/**
 * Predefined variables
 * Name = SetComponentEnable
 * DateTime = Mon Sep 19 2022 14:57:34 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = SetComponentEnable.ts
 * FileBasenameNoExtension = SetComponentEnable
 * URL = db://assets/NoUi3/fuckui/SetComponentEnable.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
//动态设置某组件的enabled状态
@ccclass('SetComponentEnable')
@executeInEditMode()
export class SetComponentEnable extends SetComponentPropertyValue {

    @property({ visible() { return false }, override: true })
    property: number = 0;
    @property({ visible() { return false }, override: true })
    propertyNames: string[] = ['enabled'];

    protected setPropertyEnum() {

    }

    public a_enable(): void {
        this.onDataChange(true);
    }

    public a_disable(): void {
        this.onDataChange(false);
    }

}
