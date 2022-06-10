
import { _decorator, Component, Node, Size, size, ScrollView, UITransform, find } from 'cc';
import { YJDataWork } from '../../base/YJDataWork';
import { no } from '../../no';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = YJComboBox
 * DateTime = Fri Apr 01 2022 10:32:46 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJComboBox.ts
 * FileBasenameNoExtension = YJComboBox
 * URL = db://assets/NoUi3/widget/combobox/YJComboBox.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */
/**
 * data :: {
 *      list: {id: string, title: string, icon?:string, checked?: boolean}[],
 *      selected?: 0
 * }
 */
@ccclass('YJComboBox')
export class YJComboBox extends YJDataWork {
    @property({ displayName: '列表最大尺寸' })
    size: Size = size();

    @property({ displayName: '动画时长', min: 0, step: 0.01 })
    duration: number = 0.1;

    @property({ displayName: '默认显示列表' })
    autoShow: boolean = false;

    @property(no.EventHandlerInfo)
    onShow: no.EventHandlerInfo[] = [];

    @property(no.EventHandlerInfo)
    onChange: no.EventHandlerInfo[] = [];

    private isShow: boolean = false;

    onLoad() {
        let sv = this.getComponentInChildren(ScrollView);
        sv.node.getComponent(UITransform).setContentSize(this.size);
        find('Canvas').on(Node.EventType.TOUCH_START, this.hideList, this);
    }

    onDestroy() {
        find('Canvas').off(Node.EventType.TOUCH_START, this.hideList, this);
    }

    protected afterInit() {
        this.setListVisible(this.autoShow);
        this.setChecked(this.data.selected);
    }

    public a_changeVisible(): void {
        this.setListVisible(!this.isShow);
    }

    public a_onSelect(d: any): void {
        this.setListVisible(false);
        no.EventHandlerInfo.execute(this.onChange, d);
        this.setChecked(d.id);
    }

    private hideList() {
        if (this.isShow) this.a_changeVisible();
    }

    private setListVisible(v: boolean) {
        this.isShow = v;
        this.data = {
            visible_ani: {
                duration: this.duration,
                to: 1,
                props: {
                    size: [this.size.width, v ? this.size.height : 0],
                    opacity: v ? 255 : 0
                }
            },
            dir: v ? -1 : 1,
            x: v ? 0 : -10000
        };
        if (v) {
            no.EventHandlerInfo.execute(this.onShow);
        }
    }

    private setChecked(id: string) {
        let list = this.data.list;
        list.forEach((a: any) => {
            a.checked = a.id == id;
            if (a.checked) {
                this.data = {
                    title: a.title,
                    icon: a.icon
                };
            }
        });
        this.data = { list: list };
    }
}
