import { EDITOR, Node, ScrollView, Size, Vec2, ccclass, instantiate, isValid, property, size } from '../../NoUi3/yj';
import { YJDataWork } from '../base/YJDataWork';
import { YJLoadAssets } from '../editor/YJLoadAssets';
import { YJDynamicAtlas } from '../engine/YJDynamicAtlas';
import { no } from '../no';
import { FuckUi } from './FuckUi';
import { SetCreateNode } from './SetCreateNode';

/**
 * 多模板动态列表
 * Author mqsy_yj
 * DateTime Wed Jan 24 2024 12:18:29 GMT+0800 (中国标准时间)
 * 
 */

const templateTypeKey = '_template_type_';

@ccclass('SetMultipleListInfo')
export class SetMultipleListInfo {
    @property({ displayName: '模板类型标识' })
    type: string = '';
    @property({ type: Node, displayName: '元素模板' })
    template: Node = null;
    @property({ displayName: '所需元素节点个数' })
    showMax: number = 0;
    @property({ visible() { return false; } })
    itemSize: Size = size();

    public initTemplate(parent: Node) {
        let nodes: Node[] = [], i = 0;
        while (i++ < this.showMax) {
            let a = instantiate(this.template);
            a[templateTypeKey] = this.type;
            a['__dataIndex'] = i - 1;
            a.parent = parent;
            nodes[nodes.length] = a;
        }
        return nodes;
    }
}

@ccclass('SetMultipleList')
export class SetMultipleList extends FuckUi {
    @property({ type: SetMultipleListInfo })
    templates: SetMultipleListInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '创建完成回调' })
    onComplete: no.EventHandlerInfo[] = [];
    @property({ type: no.EventHandlerInfo, displayName: '滚动时回调' })
    onScrolling: no.EventHandlerInfo[] = [];

    @property(ScrollView)
    scrollView: ScrollView = null;
    @property(Node)
    content: Node = null;
    @property({ displayName: 'content扩展' })
    offset: Size = size();
    @property(YJDynamicAtlas)
    dynamicAtlas: YJDynamicAtlas = null;
    @property(YJLoadAssets)
    loadAsset: YJLoadAssets = null;

    @property({ displayName: '数据更新时自动回滚到第1个' })
    autoScrollBack: boolean = false;

    @property({ tooltip: 'disable时清除子节点' })
    clearOnDisable: boolean = true;
    @property({ tooltip: 'enable时重新创建子节点', visible() { return this.clearOnDisable; } })
    recreateOnEnable: boolean = false;
    @property({ displayName: '设置元素模板相关数据' })
    public get setTemplateInfo(): boolean {
        return false;
    }

    public set setTemplateInfo(v: boolean) {
        if (!this.scrollView) {
            console.error('scrollView 为 null!');
            return;
        }
        let viewSize = no.size(this.scrollView.view.node);
        let isVertical = this.scrollView.vertical;
        if (isVertical) {
            this.templates.forEach(t => {
                if (t.template) {
                    t.itemSize = no.size(t.template);
                    t.showMax = no.ceil(viewSize.height / t.itemSize.height);
                }
            });
        } else {
            this.templates.forEach(t => {
                if (t.template) {
                    t.itemSize = no.size(t.template);
                    t.showMax = no.ceil(viewSize.width / t.itemSize.width);
                }
            });
        }
    }

    private listData: any[];
    // private listItems: Node[] = [];
    private isVertical: boolean;
    /**
     * 横向时指宽，纵向时指高
     */
    private contentSize: number;
    private showNum: number;//实际最多可显示的itemPanel个数
    private allNum: number;
    /**
     * node最后的位置，横向时指x，纵向时指y
     */
    private lastIndex: number = 0;
    private _loaded: boolean = false;
    private _isSettingData: boolean = false;
    private scrollViewContent: Node;
    private scrollViewSize: Size;
    private templateMap: { [type: string]: { size: Size, anchor: Vec2, showNum: number } };
    //可用的item节点
    private itemsMap: { [type: string]: Node[] };
    private positionMap: number[] = [];
    //记录对应类型节点初始化时已使用的下标
    private typeDataIndexMap: { [type: string]: number[] } = {};

    async onLoad() {
        super.onLoad();
        if (EDITOR) {
            if (!this.dynamicAtlas) this.dynamicAtlas = no.getComponentInParents(this.node, YJDynamicAtlas);
            if (!this.loadAsset) this.loadAsset = no.getComponentInParents(this.node, YJLoadAssets);
            return;
        }
    }

    onEnable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        if (this.clearOnDisable && this.recreateOnEnable) {
            this.resetData();
        }
    }

    onDisable() {
        if (EDITOR) return;
        if (this._isSettingData) return;
        this.a_clearData();
        if (this.clearOnDisable) {
            this.clearItems();
        }
    }

    public clearItems() {
        this._loaded = false;
        this.itemsMap = null;
        this.content?.setPosition(0, 0);
        this.lastIndex = 0;
        this.content?.children.forEach(item => {
            item.destroy();
        });
    }

    public static format(data: any, templateType: string) {
        data[templateTypeKey] = templateType;
        return data;
    }

    public updateData(d: any) {
        this.listData = [].concat(d);
    }

    private async initTemplates() {
        if (this._loaded) return;
        this.isVertical = this.scrollView.vertical;
        if (!this.content)
            this.content = this.scrollView.content;
        if (this.isVertical) {
            no.anchorY(this.content, 1);
        } else {
            no.anchorX(this.content, 0);
        }
        this.scrollViewContent = this.scrollView.content;
        this.scrollViewSize = no.size(this.scrollView.view.node);
        this.templateMap = {};
        this.itemsMap = {};
        this.showNum = 0;
        for (let i = 0, n = this.templates.length; i < n; i++) {
            const t = this.templates[i];
            this.showNum += t.showMax;
            this.itemsMap[t.type] = t.initTemplate(this.content);
            this.templateMap[t.type] = { size: t.itemSize, anchor: no.anchor(t.template), showNum: t.showMax };
        }
        this._loaded = true;
    }

    private setContentSize() {
        this.scrollView.node.off(ScrollView.EventType.SCROLLING, () => {
            this.updatePos();
        }, this);

        this.contentSize = 0;
        let maxSize = 0;
        this.positionMap.length = 0;
        let lastItemSize = 0;
        this.typeDataIndexMap = {};

        this.listData.forEach((d, index) => {
            const templateType = d[templateTypeKey];
            this.typeDataIndexMap[templateType] = this.typeDataIndexMap[templateType] || [];
            this.typeDataIndexMap[templateType][this.typeDataIndexMap[templateType].length] = index;
            if (templateType) {
                const template = this.templateMap[templateType],
                    size = template.size;
                if (this.isVertical) {
                    this.contentSize += size.height + this.offset.height;
                    if (size.width > maxSize) maxSize = size.width;
                    this.positionMap[this.positionMap.length] = (this.positionMap[this.positionMap.length - 1] || 0) - lastItemSize - this.offset.height;
                    lastItemSize = size.height;
                } else {
                    this.contentSize += size.width + this.offset.width;
                    if (size.height > maxSize) maxSize = size.height;
                    this.positionMap[this.positionMap.length] = (this.positionMap[this.positionMap.length - 1] || 0) + lastItemSize + this.offset.width;
                    lastItemSize = size.width;
                }
            }
        });

        let s: Size;
        if (this.isVertical) {
            s = size(maxSize, this.contentSize);
        } else {
            s = size(this.contentSize, maxSize);
        }
        no.size(this.content, s);


        let p = no.position(this.content);
        if (this.autoScrollBack) {
            p.x = 0;
            p.y = 0;
            no.position(this.content, p);
            this.lastIndex = 0;
        } else {
            if (this.isVertical) {
                p.y = Math.min(p.y, Math.max(0, s.height - this.scrollViewSize.height));
            } else {
                p.x = Math.max(p.x, Math.min(0, this.scrollViewSize.width - s.width));
            }
            no.position(this.content, p);
        }

        this.scrollView.node.on(ScrollView.EventType.SCROLLING, () => {
            this.updatePos();
        }, this);
    }

    protected async onDataChange(data: any) {
        this.unscheduleAllCallbacks();
        if (!this?.node?.isValid) return;
        await this.initTemplates();
        if (!this?.node?.isValid || !this?.content?.isValid) return;
        let a = [].concat(data);
        this.listData = a;
        this.allNum = a.length;
        this.setContentSize();
        this.setList();
        if (!this?.node?.isValid) return;
        no.EventHandlerInfo.execute(this.onComplete);
        this._isSettingData = false;
    }

    // private setList() {
    //     if (!this.node.isValid) return;
    //     for (const type in this.typeDataIndexMap) {
    //         const indexs: number[] = this.typeDataIndexMap[type],
    //             items: Node[] = this.itemsMap[type],
    //             n = indexs.length,
    //             len = items.length,
    //             lastIndex = this.lastIndex;
    //         let i = 0;
    //         for (; i < n; i++) {
    //             if (i >= lastIndex) break;
    //         }
    //         if (n - i < len) i = n - len;
    //         for (let j = 0; j < len; j++) {
    //             const k = indexs[i + j],
    //                 item = items[j];
    //             if (k != undefined) {
    //                 this.setItemData(item, this.listData[k]);
    //                 this.setItemPosition(item, k);
    //                 no.visible(item, true);
    //             }
    //         }
    //     }
    // }

    private setList() {
        if (!this.node.isValid) return;
        for (const type in this.typeDataIndexMap) {
            const indexs: number[] = this.typeDataIndexMap[type];
            for (let i = 0, n = indexs.length; i < n; i++) {
                if (indexs[i] >= this.lastIndex) {
                    let items: Node[] = this.itemsMap[type];
                    items.forEach((item, j) => {
                        const k = indexs[i + j];
                        if (k != undefined) {
                            this.setItemData(item, this.listData[k]);
                            this.setItemPosition(item, k);
                            no.visible(item, true);
                        }
                        else {
                            no.visible(item, false);
                            item['__dataIndex'] = -1;
                        }
                    });
                    break;
                }
            }
        }
    }

    //asc:true表示index的item后移，false表示要显示index-1的item
    private setItemAt(lastIndex: number, curIndex: number, asc: boolean) {
        if (asc) {
            for (let index = lastIndex; index < curIndex; index++) {
                const d = this.listData[index],
                    templateType = d[templateTypeKey],
                    showNum = this.templateMap[templateType].showNum,
                    indexs = this.typeDataIndexMap[templateType],
                    i = indexs.indexOf(index),
                    items = this.itemsMap[templateType],
                    ni = i + showNum,
                    nIndex = indexs[ni],
                    nItem: Node = no.itemOfArray(items, nIndex, '__dataIndex');
                // no.log(`setMultipleList from ${index} to ${nIndex}`)
                if (nItem) continue;;
                const item: Node = no.itemOfArray(items, index, '__dataIndex');
                if (!item) continue;
                const nd = this.listData[nIndex];
                if (nd) {
                    this.setItemData(item, nd);
                    this.setItemPosition(item, nIndex);
                    no.visible(item, true);
                } else {
                    no.log(index);
                }
            }
        } else {
            for (let index = lastIndex - 1; index >= curIndex; index--) {
                const d = this.listData[index],
                    templateType = d[templateTypeKey],
                    showNum = this.templateMap[templateType].showNum,
                    items = this.itemsMap[templateType];
                if (no.itemOfArray(items, index, '__dataIndex')) continue;
                const indexs = this.typeDataIndexMap[templateType],
                    i = indexs.indexOf(index) + showNum;
                let nIndex = indexs[i];
                if (nIndex == undefined) nIndex = -1;
                let item: Node = no.itemOfArray(items, nIndex, '__dataIndex');
                // no.log(`setMultipleList from ${nIndex} to ${index}`)
                if (!item) continue;
                const nd = this.listData[index];
                if (nd) {
                    this.setItemData(item, nd);
                    this.setItemPosition(item, index);
                    no.visible(item, true);
                } else {
                    no.log(index);
                }
            }
        }
    }

    private setItemData(item: Node, data = []) {
        let b = item.getComponent(YJDataWork);
        if (b) {
            b.data = data;
            b.init();
        }
        else {
            let a = item.getComponent(SetCreateNode);
            if (a)
                a.setData(no.jsonStringify(data));
        }
    }

    private setItemPosition(item: Node, index: number) {
        item['__dataIndex'] = index;
        let p = item.getPosition();
        if (this.isVertical) {
            p.y = this.positionMap[index];
        } else {
            p.x = this.positionMap[index];
        }
        item.setPosition(p);
    }

    private updatePos() {
        if (!isValid(this?.node)) return;
        let listItems = this.content.children;
        if (this.listData == null || listItems == null || listItems.length == 0) return;
        let curPos = 0;
        let startIndex = 0;
        if (this.isVertical) {
            curPos = -no.y(this.scrollViewContent);
        } else {
            curPos = -no.x(this.scrollViewContent);
        }
        if (curPos != 0) {
            for (let i = 0, n = this.positionMap.length; i < n; i++) {
                if (curPos > this.positionMap[i]) {
                    startIndex = i - 1;
                    break;
                }
            }
        }
        no.EventHandlerInfo.execute(this.onScrolling, curPos, -curPos / this.contentSize);
        if (this.positionMap[startIndex] == null) return;

        let diff = startIndex - this.lastIndex;
        if (diff != 0) {
            this.setItemAt(this.lastIndex, startIndex, diff > 0);
            this.lastIndex = startIndex;
            // let n = listItems.length;
            // for (let i = 0; i < n; i++) {
            //     let item = listItems[i];
            //     let dataIndex = item['__dataIndex'];
            //     if (diff < 0) {//向右
            //         if (dataIndex - startIndex > this.showNum - 1 && dataIndex - n >= 0) {
            //             // this.setItemData(item, this.listData[dataIndex - n]);
            //             // this.setItemPosition(item, dataIndex - n);
            //             this.setItemAt(startIndex);
            //         }
            //     } else if (diff > 0) {//向左
            //         if (dataIndex < startIndex && dataIndex + n < this.allNum) {
            //             // this.setItemData(item, this.listData[dataIndex + n]);
            //             // this.setItemPosition(item, dataIndex + n);
            //             this.setItemAt(startIndex, false);
            //         }
            //     }
            // }
        }
    }
}
