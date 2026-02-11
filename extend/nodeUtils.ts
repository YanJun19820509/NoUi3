import { no } from "../no";
import { BlockInputEvents, Button, Component, director, EDITOR, EventTouch, js, Layers, Node, NodeEventType, Rect, rendererCamera, Size, sys, UIOpacity, UITransform, v2, v3, Vec2, Vec3, view } from "../yj";
/**
 * 
 * Author mqsy_yj
 * DateTime Mon Feb 09 2026 09:27:57 GMT+0800 (中国标准时间)
 *
 */

/**
 * 节点属性工具类
 * @namespace nodeProperties
 * @description 提供节点的工具方法
 * @example
 * nodeProperties.angle(node, 90);
 * nodeProperties.angle(node);
 */
export namespace nodeUtils {
    /**
     * 设置或获取节点旋转角度
     * @param node 节点
     * @param angle 旋转角度
     * @returns 节点旋转角度
     */
    export function angle(node: Node, angle?: number): void | number {
        if (!node) return;
        if (angle != undefined) {
            node.angle = angle;
        } else {
            return node.angle;
        }
    }

    /**
     * 设置或获取节点缩放
     * @param node 节点
     * @param data 缩放值
     * @returns 节点缩放
     */
    export function scale(node: Node, data?: number | number[]): void | Vec3 {
        if (!node) return;
        if (data == undefined) {
            return node.scale.clone();
        }
        if (data instanceof Array)
            node.setScale(data[0], (data[1] || data[0]), data[2]);
        else {
            node.setScale(data, data, data);
        }
    }

    /**
     * 乘以节点原有缩放
     * @param node 节点
     * @param data 缩放值
     * @returns 节点缩放
     */
    export function multiplyScale(node: Node, data: number | number[]): void {
        if (!node) return;
        if (!node['_origin_scale_']) {
            node['_origin_scale_'] = node.scale.clone();
        }
        let originScale = node['_origin_scale_'].clone();
        if (data instanceof Array)
            node.setScale(originScale.multiply3f(data[0], data[1] || data[0], data[2] || 1));
        else
            node.setScale(originScale.multiplyScalar(data));
    }

    /**
     * 重置节点缩放
     * @param node 节点
     * @returns 节点缩放
     */
    export function resetScale(node: Node): void {
        if (!node) return;
        if (node['_origin_scale_']) {
            node.setScale(node['_origin_scale_']);
        }
    }

    /**
     * 翻转节点
     * @param node 节点
     * @param horizontal 水平翻转
     * @param vertical 垂直翻转
     * @returns 节点缩放
     */
    export function flip(node: Node, horizontal: boolean, vertical: boolean): void {
        if (!node) return;
        let data = [1, 1];
        if (horizontal) {
            data[1] = -1;
        }
        if (vertical) {
            data[0] = -1;
        }
        multiplyScale(node, data);
    }



    let _tempPos: Vec3 = new Vec3(); // 复用临时坐标对象以优化性能
    /**
     * 获取或设置节点x坐标（世界坐标系）
     * @param node 目标节点
     * @param x 要设置的x坐标值（可选，不传时返回当前值）
     * @returns 当前/设置后的x坐标
     * @example
     * // 获取玩家x坐标
     * const playerX = no.x(this.playerNode);
     * 
     * // 设置敌人x坐标到屏幕右侧
     * no.x(this.enemyNode, 800);
     * 
     * // 配合缓动动画使用
     * no.tween(this.bulletNode)
     *   .to(0.5, { x: no.x(this.targetNode) })
     *   .start();
     */
    export function x(node: Node, x1?: number): number {
        if (!node) return;
        let { x, y } = node.position;
        if (x1 != undefined) {
            x = x1;
            node.setPosition(x, y);
        }
        return x;
    }

    /**
     * 获取或设置节点y坐标（世界坐标系）
     * @param node 目标节点
     * @param y 要设置的y坐标值（可选，不传时返回当前值）
     * @returns 当前/设置后的y坐标
     * @example
     * // 检测是否超出屏幕上方
     * if (no.y(this.itemNode) > 1280) {
     *   this.recycleItem();
     * }
     * 
     * // 设置跳跃高度
     * no.y(this.characterNode, 500);
     * 
     * // 垂直方向缓动
     * no.tween(this.cloudNode)
     *   .by(2, { y: -200 })
     *   .start();
     */
    export function y(node: Node, y1?: number): number {
        if (!node) return;
        let { x, y } = node.position;
        if (y1 != undefined) {
            y = y1;
            node.setPosition(x, y);
        }
        return y;
    }

    /**
     * 获取或设置节点z坐标（3D坐标系）
     * @param node 目标节点
     * @param z 要设置的z坐标值（可选，不传时返回当前值）
     * @returns 当前/设置后的z坐标
     * @example
     * // 设置3D物体的层级
     * no.z(this.backgroundModel, 100);
     * 
     * // 调整UI元素的显示层级
     * no.z(this.popupNode, 999);
     * 
     * // 创建视差滚动效果
     * update() {
     *   no.z(this.layer1, no.z(this.layer1) + delta * 0.1);
     *   no.z(this.layer2, no.z(this.layer2) + delta * 0.2);
     * }
     */
    export function z(node: Node, z1?: number): number {
        if (!node) return;
        let { x, y, z } = node.position;
        if (z1 != undefined) {
            z = z1;
            node.setPosition(x, y, z);
        }
        return z;
    }
    /**
     * 获取或设置节点在父容器中的渲染顺序（siblingIndex）
     * @param node 目标节点
     * @param index 要设置的顺序索引（0表示最底层，数值越大层级越高）。未提供时返回当前索引
     * @returns 当前/设置后的层级索引
     * @example
     * // 设置按钮为最顶层显示
     * no.siblingIndex(this.btnNode, this.btnNode.parent.children.length - 1);
     * 
     * // 动态调整UI元素层级
     * const currentIndex = no.siblingIndex(this.popupWindow);
     * no.siblingIndex(this.popupWindow, currentIndex + 1);
     * 
     * // 重置子节点顺序为添加顺序
     * parentNode.children.forEach((child, index) => {
     *   no.siblingIndex(child, index);
     * });
     */
    export function siblingIndex(node: Node, index?: number): number {
        if (!node) return;
        if (!node.parent?.['_children']) return 0;
        if (index != undefined) {
            node.setSiblingIndex(index);
            return index;
        }
        let p = node.parent['_children']?.findIndex(a => a.uuid == node.uuid) || 0;
        return p;
    }

    /**
     * 获取或设置节点世界坐标系位置（同时支持2D/3D坐标系）
     * @param node 目标节点
     * @param pos 要设置的三维坐标值（可选，未提供时返回当前坐标的克隆值）
     * @returns 当前/设置后的位置向量（返回新对象避免引用问题）
     * @example
     * // 设置敌人出生位置
     * no.position(this.enemyNode, no.v3(100, 200, 0));
     * 
     * // 获取玩家当前位置
     * const playerPos = no.position(this.playerNode);
     * 
     * // 实现位置缓动动画
     * no.tween(this.itemNode)
     *   .to(1, { position: no.v3(0, 100, 0) })
     *   .start();
     */
    export function position(node: Node, pos?: Vec3 | { x: number, y: number, z?: number }): Vec3 {
        if (!node) return;
        if (pos != undefined) {
            node.setPosition(pos.x, pos.y, pos.z);
        } else {
            return node.position;
        }
    }

    export function worldPosition(node: Node, pos?: Vec3 | { x: number, y: number, z?: number }): Vec3 {
        if (!node) return;
        if (pos != undefined) {
            node.setWorldPosition(pos.x, pos.y, pos.z || 0);
        } else {
            return node.worldPosition;
        }
    }

    /**
     * 获取或设置节点欧拉角旋转（单位：角度制）
     * @param node 目标节点
     * @param r 要设置的三轴旋转角度（可选，未提供时返回当前旋转的克隆值）
     * @returns 当前/设置后的欧拉角向量（返回新对象避免引用问题）
     * @example
     * // 设置3D模型旋转角度
     * no.rotation(this.airplaneModel, no.v3(0, 45, 0)); // Y轴旋转45度
     * 
     * // 实现持续旋转动画
     * update() {
     *   const currentRot = no.rotation(this.windmillNode);
     *   no.rotation(this.windmillNode, no.v3(0, currentRot.y + 1, 0));
     * }
     * 
     * // 重置2D精灵旋转角度
     * no.rotation(this.uiIcon, no.v3(0, 0, 0));
     */
    export function rotation(node: Node, r?: Vec3): Vec3 {
        if (!node) return;
        if (r != undefined) {
            node.setRotationFromEuler(r);
        }
        return node.eulerAngles.clone(); // 返回克隆保证数据安全
    }

    /**
     * 获取或设置节点宽度（需要节点包含UITransform组件）
     * @param node 目标节点
     * @param width 要设置的宽度值（可选，未提供时返回当前宽度）
     * @returns 当前/设置后的宽度值（单位：像素）
     * @example
     * // 设置按钮宽度为200像素
     * no.width(this.startBtn, 200);
     * 
     * // 根据文本内容动态调整宽度
     * const textWidth = this.label.node.getComponent(UITransform).width;
     * no.width(this.backgroundNode, textWidth + 40);
     * 
     * // 获取滚动视图的当前宽度
     * const viewWidth = no.width(this.scrollView.node);
     */
    export function width(node: Node, width?: number): number {
        if (!node || !node.getComponent(UITransform)) return;
        if (width != undefined)
            node.getComponent(UITransform).width = width;
        return node.getComponent(UITransform).width;
    }

    /**
     * 获取或设置节点高度（需要节点包含UITransform组件）
     * @param node 目标节点
     * @param height 要设置的高度值（可选，未提供时返回当前高度）
     * @returns 当前/设置后的高度值（单位：像素）
     * @example
     * // 设置对话框高度为屏幕高度的80%
     * no.height(this.dialogNode, no.winSize().height * 0.8);
     * 
     * // 动态扩展高度适应内容
     * const contentHeight = this.contentNode.getComponent(UITransform).height;
     * no.height(this.scrollContent, contentHeight + 100);
     * 
     * // 获取精灵图标的原始高度
     * const originalHeight = no.height(this.spriteNode);
     */
    export function height(node: Node, height?: number): number {
        if (!node || !node.getComponent(UITransform)) return;
        if (height != undefined)
            node.getComponent(UITransform).height = height;
        return node.getComponent(UITransform).height;
    }

    /**
     * 获取或设置节点尺寸（需要节点包含UITransform组件）
     * @param node 目标节点
     * @param size 要设置的尺寸对象（可选，未提供时返回当前尺寸的克隆）
     * @returns 当前/设置后的尺寸对象（返回新对象避免直接修改）
     * @example
     * // 同时设置宽高尺寸
     * no.size(this.avatarNode, new Size(120, 120));
     * 
     * // 根据图片原始尺寸调整节点
     * const textureSize = this.sprite.spriteFrame.originalSize;
     * no.size(this.imageNode, textureSize);
     * 
     * // 获取当前尺寸并等比放大
     * const currentSize = no.size(this.itemNode);
     * no.size(this.itemNode, currentSize.multiplyScalar(1.5));
     */
    export function size(node: Node, size?: Size | { width: number, height: number }): Size {
        if (!node || !node.getComponent(UITransform)) return;
        if (size != undefined)
            node.getComponent(UITransform).setContentSize(size.width, size.height);
        return node.getComponent(UITransform).contentSize.clone();
    }

    /**
     * 获取或设置节点透明度（自动添加UIOpacity组件）
     * @param node 目标节点
     * @param opacity 要设置的透明度（0-255，可选，未提供时返回当前值）
     * @returns 当前/设置后的透明度值
     * @example
     * // 渐隐效果实现
     * no.tween(this.fadeNode)
     *   .to(1, { opacity: 0 })
     *   .start();
     * 
     * // 半透明状态切换
     * const isTransparent = no.opacity(this.panelNode) < 255;
     * no.opacity(this.panelNode, isTransparent ? 255 : 150);
     * 
     * // 获取文字当前透明度
     * const textAlpha = no.opacity(this.titleLabel.node);
     */
    export function opacity(node: Node, opacity?: number): number {
        if (!node) return;
        let op = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        if (opacity != undefined) op.opacity = opacity;
        return op.opacity;
    }

    /**
     * 获取或设置节点锚点X坐标（基于UITransform组件）
     * @param node 目标节点
     * @param x 锚点X坐标（0-1，可选，未提供时返回当前值）
     * @returns 当前/设置后的锚点X坐标
     * @example
     * // 设置按钮右对齐
     * no.anchorX(this.btnNode, 1);
     * 
     * // 获取文本水平锚点用于居中计算
     * const anchorX = no.anchorX(this.labelNode);
     * this.labelNode.position.x = screenWidth * (0.5 - anchorX);
     */
    export function anchorX(node: Node, x?: number): number {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (x != undefined) t.anchorX = x;
        return t.anchorX;
    }

    /**
     * 获取或设置节点锚点Y坐标（基于UITransform组件）
     * @param node 目标节点
     * @param y 锚点Y坐标（0-1，可选，未提供时返回当前值）
     * @returns 当前/设置后的锚点Y坐标
     * @example
     * // 设置进度条底部对齐
     * no.anchorY(this.progressBar, 0);
     * 
     * // 动态调整弹窗垂直锚点
     * no.anchorY(this.popup, isTop ? 1 : 0.5);
     */
    export function anchorY(node: Node, y?: number): number {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (y != undefined) t.anchorY = y;
        return t.anchorY;
    }

    /**
     * 获取或设置节点锚点（支持同时设置X/Y坐标）
     * @param node 目标节点
     * @param args 参数格式：
     *            - 无参数：返回当前锚点
     *            - 单个数字：同时设置X/Y锚点
     *            - 两个数字：分别设置X/Y锚点
     * @returns 当前/设置后的锚点副本
     * @example
     * // 设置中心锚点
     * no.anchor(this.spriteNode, 0.5);
     * 
     * // 设置左上角锚点
     * no.anchor(this.uiPanel, 0, 1);
     * 
     * // 获取当前锚点用于计算
     * const currentAnchor = no.anchor(this.draggableItem);
     */
    export function anchor(node: Node, ...args: number[]): Vec2 {
        if (!node) return;
        let t = node.getComponent(UITransform);
        if (args != undefined && args.length > 0) t.setAnchorPoint(args[0], args[1] == null ? args[0] : args[1]);
        else return t.anchorPoint;
    }

    /**
     * 获取节点在层级关系中的原始缩放值（不受父节点缩放影响）
     * @param node 目标节点
     * @returns 节点在层级中的原始缩放值（Vec3类型）
     * @example
     * // 获取UI元素的原始缩放
     * const originalScale = no.scaleInHierarchy(this.uiElement);
     * 
     * // 重置节点缩放
     * this.node.scale = no.scaleInHierarchy(this.node);
     * 
     * // 比较世界缩放与原始缩放
     * const worldScale = this.node.worldScale;
     * const localScale = no.scaleInHierarchy(this.node);
     */
    export function scaleInHierarchy(node: Node) {
        return node['_scale'];
    }

    /**
     * 获取节点及其所有激活子节点在世界坐标系中的包围矩形
     * @param node 目标节点
     * @returns 世界坐标系中的包围矩形（Rect类型）
     * @example
     * // 检测玩家与障碍物的碰撞
     * const playerBox = no.boundingBox(this.playerNode);
     * const obstacleBox = no.boundingBox(this.rockNode);
     * if (playerBox.intersects(obstacleBox)) {
     *   this.onCollision();
     * }
     * 
     * // 计算UI容器总尺寸
     * const containerRect = no.boundingBox(this.scrollContent);
     * this.label.string = `尺寸：${containerRect.width.toFixed(0)}x${containerRect.height.toFixed(0)}`;
     * 
     * // 屏幕边缘检测
     * const screenRect = new Rect(0, 0, screen.width, screen.height);
     * if (!screenRect.contains(no.boundingBox(this.enemyNode))) {
     *   this.destroyEnemy();
     * }
     */
    export function boundingBox(node: Node): Rect {
        return node.getComponent(UITransform).getBoundingBoxToWorld();
    }

    /**
     * 获取节点的世界坐标系坐标（基于Cocos Creator坐标系，屏幕左下角为原点）
     * @param node 目标节点
     * @param out 可选输出向量，用于复用Vec3对象（提升性能）
     * @returns 世界坐标系中的三维坐标
     * @example
     * // 获取玩家角色世界坐标
     * const playerPos = no.nodeWorldPosition(this.playerNode);
     * // 复用向量对象避免频繁创建
     * const tempPos = no.v3();
     * no.nodeWorldPosition(this.enemyNode, tempPos);
     */
    export function nodeWorldPosition(node: Node, out?: Vec3): Vec3 {
        if (!no.checkValid(node)) return;
        out = out || _tempPos;
        node.getWorldPosition(out);
        return out;
    }

    /**
     * 将世界坐标转换为节点本地坐标系坐标
     * @param pos 世界坐标系中的位置
     * @param node 目标节点（需要包含UITransform组件）
     * @param out 可选输出向量，用于复用Vec3对象
     * @returns 节点本地坐标系中的坐标
     * @example
     * // 转换点击位置到UI节点本地坐标
     * const touchWorldPos = no.v3(event.touch._point.x, event.touch._point.y);
     * const localPos = no.worldPositionInNode(touchWorldPos, this.uiPanel);
     * // 处理3D物体在UI中的投影位置
     * const modelWorldPos = this.modelNode.worldPosition;
     * const uiLocalPos = no.worldPositionInNode(modelWorldPos, this.uiContainer);
     */
    export function worldPositionInNode(pos: Vec3, node: Node, out?: Vec3): Vec3 {
        if (!no.checkValid(node)) return;
        out = out || _tempPos;
        node.getComponent(UITransform).convertToNodeSpaceAR(pos, out);
        return out;
    }

    /**
     * 将节点A的坐标转换为节点B的本地坐标系坐标
     * @param node 源节点
     * @param otherNode 目标节点（需要包含UITransform组件）
     * @param out 可选输出向量，用于复用Vec3对象
     * @returns 目标节点本地坐标系中的坐标
     * @example
     * // 转换小地图图标到全屏地图的位置
     * const miniMapPos = no.nodePositionInOtherNode(this.iconNode, this.fullMapNode);
     * // 计算两个UI元素的相对位置
     * const buttonPos = no.nodePositionInOtherNode(this.btnNode, this.mainPanel);
     * // 跟踪3D物体在雷达图上的位置
     * const radarPos = no.nodePositionInOtherNode(this.aircraftNode, this.radarNode);
     */
    export function nodePositionInOtherNode(node: Node, otherNode: Node, out?: Vec3): Vec3 {
        out = out || _tempPos;
        nodeWorldPosition(node, out);
        otherNode.getComponent(UITransform).convertToNodeSpaceAR(out, out);
        return out;
    }



    /**
     * 计算节点在世界坐标系中的包围盒矩形
     * @param node 目标节点
     * @param offset 矩形偏移量（可选，默认Vec2.ZERO）
     * @param subSize 尺寸增减量（可选，默认Size.ZERO）
     * @returns 世界坐标系中的矩形区域
     * @example
     * // 检测按钮在世界空间的实际范围
     * const btnBox = no.nodeBoundingBox(this.startBtn);
     * 
     * // 带偏移和尺寸扩展的碰撞检测
     * const enemyHitBox = no.nodeBoundingBox(
     *   enemyNode, 
     *   v2(10, -5),  // 向右偏移10，向下偏移5
     *   size(20, 20) // 宽高各增加20
     * );
     * 
     * // 配合物理系统使用
     * const collider = this.getComponent(BoxCollider2D);
     * collider.size = no.nodeBoundingBox(this.node).size;
     */
    export function nodeBoundingBox(node: Node, offset?: Vec2, subSize?: Size): Rect {
        offset = offset || v2();
        subSize = subSize || Size.ZERO;
        let origin = _tempPos;
        origin = nodeWorldPosition(node, origin);
        let anchor = node.getComponent(UITransform).anchorPoint;
        let size = node.getComponent(UITransform).contentSize;
        let rect = new Rect();
        rect.height = size.height + subSize.height;
        rect.width = size.width + subSize.width;
        rect.x = origin.x - anchor.x * size.width;
        rect.y = origin.y - anchor.y * size.height
        return rect;
    }

    /**
     * 获取节点在父节点坐标系中的矩形区域
     * @param node 目标节点
     * @returns 父节点坐标系中的矩形
     * @example
     * // 检测子节点是否在父容器可见区域
     * const itemRect = no.nodeRect(scrollView.content.children[0]);
     * const viewRect = no.nodeRect(scrollView.view);
     * const isVisible = viewRect.intersects(itemRect);
     * 
     * // 拖拽对齐辅助线
     * const targetRect = no.nodeRect(dropTarget);
     * if (draggingRect.intersects(targetRect)) {
     *   showAlignmentGuide(targetRect.center);
     * }
     */
    export function nodeRect(node: Node): Rect {
        const pos = node.position,
            contentSize = size(node);
        let anchor = node.getComponent(UITransform).anchorPoint;
        const rect = new Rect();
        rect.x = pos.x - anchor.x * contentSize.width;
        rect.y = pos.y - anchor.y * contentSize.height
        rect.height = contentSize.height;
        rect.width = contentSize.width;
        return rect;
    }

    export function nodeRectInOther(node: Node, other: Node): Rect {
        const pos = nodePositionInOtherNode(node, other, _tempPos),
            contentSize = size(node);
        let anchor = node.getComponent(UITransform).anchorPoint;
        const rect = new Rect();
        rect.x = pos.x - anchor.x * contentSize.width;
        rect.y = pos.y - anchor.y * contentSize.height
        rect.height = contentSize.height;
        rect.width = contentSize.width;
        return rect;
    }

    /**
     * 检测坐标点是否在节点范围内（支持世界坐标系）
     * @param node 目标节点
     * @param point 检测点（世界坐标系）
     * @param offset 包围盒偏移量（可选）
     * @param subSize 包围盒尺寸调整（可选）
     * @returns 是否包含该点
     * @example
     * // 按钮点击检测
     * input.on(Input.EventType.TOUCH_END, (event) => {
     *   const touchPos = event.touch.getUILocation();
     *   if (no.nodeContainsPoint(this.btnNode, touchPos)) {
     *     this.onClickButton();
     *   }
     * });
     * 
     * // 自定义热区检测（扩展点击区域）
     * const isHit = no.nodeContainsPoint(
     *   this.smallButton,
     *   touchPos,
     *   v2(-10, -10), // 向左上偏移
     *   size(20, 20)  // 扩大点击区域
     * );
     */
    export function nodeContainsPoint(node: Node, point: Vec2, offset?: Vec2, subSize?: Size): boolean {
        let rect = nodeBoundingBox(node, offset, subSize);
        return rect.contains(point);
    }

    /**
     * 检测两个节点在场景中是否相交
     * @param node 第一个节点
     * @param otherNode 第二个节点
     * @returns 是否发生矩形相交
     * @example
     * // 敌人与子弹碰撞检测
     * update() {
     *   this.bullets.forEach(bullet => {
     *     if (no.nodeIntersects(this.enemyNode, bullet.node)) {
     *       this.onEnemyHit();
     *     }
     *   });
     * }
     * 
     * // UI元素重叠提示
     * const isOverlap = no.nodeIntersects(
     *   this.draggingItem, 
     *   this.inventorySlot
     * );
     * this.slotHighlight.active = isOverlap;
     */
    export function nodeIntersects(node: Node, otherNode: Node): boolean {
        let rect = nodeBoundingBox(node),
            rect1 = nodeBoundingBox(otherNode);
        return rect.intersects(rect1);
    }



    /**
     * 设置节点可渲染标志（通过调整节点位置实现）
     * @param node - 要操作的节点
     * @param v - 是否可渲染（true=显示，false=隐藏到屏幕外）
     * @returns 当前是否可渲染
     * @example
     * // 隐藏UI面板
     * visible(uiNode, false);
     * 
     * // 显示游戏角色
     * visible(playerNode, true);
     */
    export function visible(node: Node, v?: boolean): boolean {
        if (!no.checkValid(node)) return false;
        if (v != undefined && node.active != v) {
            node.active = v;
        }
        return node.active;

        // 通过修改节点X坐标实现隐藏（保留原始坐标用于恢复）
        if (node['__origin_x__'] == null) {
            node['__origin_x__'] = x(node);
        }

        if (v != undefined) {
            node['yj_need_render'] = v;
            if (v) {
                if (!node.active) node.active = true;
            }
            if (!EDITOR) {
                // 将节点移动到屏幕外实现隐藏（20000像素）
                x(node, !v ? 20000 : node['__origin_x__']);
                // 处理输入阻断组件
                const blockInputEvents = node.getComponent(BlockInputEvents);
                if (blockInputEvents)
                    blockInputEvents.enabled = v;
                // 处理自定义按钮组件
                const btn = node.getComponent(Button);
                if (btn) btn.interactable = v;
            }
            node.emit(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, node);
        }
        return node['yj_need_render'] !== false;
    }

    /**
     * 通过透明度设置节点可渲染标志（不触发生命周期方法）
     * @param node - 要操作的节点
     * @param v - 是否可渲染（true=显示，false=完全透明）
     * @returns 当前是否可渲染
     * @example
     * // 隐藏滚动列表项
     * visibleByOpacity(listItem, false);
     * 
     * // 显示缓存对象
     * visibleByOpacity(cachedNode, true);
     */
    export function visibleByOpacity(node: Node, v?: boolean): boolean {
        if (!no.checkValid(node)) return false;

        if (v != undefined) {
            node['yj_need_render'] = v;
            const uiopacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
            // 保存原始透明度用于恢复
            if (node['yj_origin_opacity'] == null)
                node['yj_origin_opacity'] = uiopacity.opacity || 255;

            if (!v) {
                uiopacity.opacity = 0;
            } else {
                uiopacity.opacity = node['yj_origin_opacity'];
                if (!node.active) node.active = true;
            }

            if (!EDITOR) {
                const blockInputEvents = node.getComponent(BlockInputEvents);
                if (blockInputEvents)
                    blockInputEvents.enabled = v;

                const btn = node.getComponent(Button);
                if (btn) btn.interactable = v;
            }
            node.emit(NodeEventType.ACTIVE_IN_HIERARCHY_CHANGED, node);
        }
        return node['yj_need_render'] !== false;
    }

    /**
     * 设置节点层级激活状态（控制交互和渲染）
     * @param node - 要操作的节点
     * @param v - 是否激活
     * @example
     * // 禁用弹窗交互
     * visibleByActiveInHierarchy(popupNode, false);
     * 
     * // 启用对象池对象
     * visibleByActiveInHierarchy(poolObject, true);
     */
    export function visibleByActiveInHierarchy(node: Node, v: boolean) {
        if (!no.checkValid(node)) return;
        const blockInputEvents = node.getComponentsInChildren(BlockInputEvents);
        if (blockInputEvents)
            for (let i = 0; i < blockInputEvents.length; i++) {
                blockInputEvents[i].enabled = v;
            }
        const btn = node.getComponent(Button);
        if (btn) btn.interactable = v;
        if (!v) {
            if (node['__origin_x__'] == null) {
                node['__origin_x__'] = x(node);
            }
            x(node, 20000);
        } else {
            if (!node.active) node.active = true;
            if (node['__origin_x__'] !== null) {
                x(node, node['__origin_x__']);
            }
        }
        node['_activeInHierarchy'] = v;
        // 激活或禁用节点的组件
        runCompActiveFunc(node, v);
    }

    // 定义一个函数runCompActiveFunc，用于激活或禁用节点的组件
    function runCompActiveFunc(node: Node, isActive: boolean) {
        if (!no.checkValid(node)) return;
        // 获取节点的组件数组
        const comps = node.components;
        // 根据isActive的值确定要调用的函数名
        const funcName = isActive ? 'onEnable' : 'onDisable';
        // 遍历组件数组，调用相应的函数
        for (let i = 0, n = comps.length; i < n; i++) {
            const comp = comps[i];
            if (comp['__proto__'].__classname__.indexOf('cc.') == 0) continue;
            if (comp[funcName]) {
                comp[funcName]();
            }
        }
        // 获取节点的子节点数组
        const children = node.children;
        // 遍历子节点数组，递归调用runCompActiveFunc函数
        for (let i = 0; i < children.length; i++) {
            runCompActiveFunc(children[i], isActive);
        }
    }

    /**
     * 将触摸事件起始点坐标转换为目标节点本地坐标系坐标
     * @param touch 触摸事件对象
     * @param node 目标节点（需要包含UITransform组件）
     * @returns 节点本地坐标系中的坐标（Vec3类型）
     * @example
     * // 在触摸事件回调中获取起始坐标
     * button.node.on(Node.EventType.TOUCH_START, (touch) => {
     *   const localPos = touchStartPosInNode(touch, button.node);
     *   console.log('触摸起始位置:', localPos);
     * });
     */
    export function touchStartPosInNode(touch: EventTouch, node: Node) {
        const p = touch.getUIStartLocation();
        return worldPositionInNode(v3(p.x, p.y), node);
    }

    /**
     * 将触摸事件当前点坐标转换为目标节点本地坐标系坐标
     * @param touch 触摸事件对象
     * @param node 目标节点（需要包含UITransform组件）
     * @returns 节点本地坐标系中的坐标（Vec3类型）
     * @example
     * // 实时跟踪触摸移动位置
     * slider.node.on(Node.EventType.TOUCH_MOVE, (touch) => {
     *   const currentPos = touchPosInNode(touch, slider.node);
     *   updateSliderThumb(currentPos.x);
     * });
     */
    export function touchPosInNode(touch: EventTouch, node: Node) {
        const p = touch.getUILocation();
        return worldPositionInNode(v3(p.x, p.y), node);
    }

    /**
     * 将节点移动指定距离或角度
     * @param node 目标节点
     * @param data 移动参数，支持多种格式：
     * @param reverse 是否反向移动
     * @returns 当前是否可渲染
     * @example
     */
    export function moveBy(node: Node, data: { x: number, y: number } | { radian: number, distance: number } | number[], reverse: boolean = false) {
        if (!no.checkValid(node)) return;
        let x: number, y: number;

        if (data && 'radian' in data && 'distance' in data) {
            /**
             * 极坐标转直角坐标公式：
             * x = distance * cos(θ)
             * y = distance * sin(θ)
             * 其中θ为以x轴正方向为起点的弧度值
             */
            x = data.distance * Math.cos(data.radian);
            y = data.distance * Math.sin(data.radian);
        } else {
            // 直角坐标系处理：支持对象和数组两种传参方式
            if (data && 'x' in data && 'y' in data) {
                x = data.x;
                y = data.y;
            } else {
                if (Array.isArray(data) && data.length > 0) {
                    x = data[0];
                    y = data[1];
                }
            }
        }

        // 反向处理：对位移量取反
        if (reverse) {
            x = -x;
            y = -y;
        }

        let pos = position(node);
        // 更新基准点坐标
        pos.x += x;
        pos.y += y;

        // 应用新位置到实际节点
        position(node, pos);
    }


    /**
     * 从父节点层级链获取组件实例（递归向上查找）
     * @param self 起始节点（搜索起点）
     * @param comp 组件类型（支持类名或组件类）
     * @returns 找到的组件实例，未找到返回null
     * @example
     * // 查找最近的UIManager组件
     * const uiManager = getComponentInParents(this.node, 'UIManager');
     * 
     * // 查找角色控制器组件
     * const controller = getComponentInParents(characterNode, CharacterController);
     * 
     * // 在子弹节点上查找武器组件
     * const weaponComp = getComponentInParents(bullet.node, WeaponComponent);
     */
    export function getComponentInParents<T extends Component>(self: Node, comp: string | typeof Component): T {
        if (typeof comp == 'string') {
            comp = js.getClassByName(comp) as (typeof Component);
        }
        let c = self.getComponent(comp);
        if (c) return c as T;

        if (self.parent) {
            c = self.parent.getComponent(comp);
            if (!c) return getComponentInParents(self.parent, comp);
            else return c as T;
        }
        return null;
    }

    /**
     * 在父节点链中查找指定名称的节点（向上查找）
     * @param self 起始节点（搜索起点）
     * @param nodeName 需要查找的目标节点名称
     * @returns 找到的节点实例，未找到返回null
     * @example
     * // 在UI层级中查找公共父容器
     * const sharedContainer = no.getNodeInParents(this.node, 'SharedUI');
     * 
     * // 查找敌人血条节点
     * const hpBar = no.getNodeInParents(enemyNode, 'EnemyHPBar');
     * 
     * // 在嵌套结构中查找根节点
     * const rootNode = no.getNodeInParents(this.node.parent, 'SceneRoot');
     */
    export function getNodeInParents(self: Node, nodeName: string): Node | null {
        if (self.parent) {
            let c = self.parent.getChildByName(nodeName);
            if (!c) return getNodeInParents(self.parent, nodeName);
            else return c;
        }
        return null;
    }

    /**
     * 递归查找子节点（深度优先搜索）
     * @param self 起始节点（搜索起点）
     * @param nodeName 需要查找的目标节点名称
     * @returns 找到的节点实例，未找到返回null
     * @example
     * // 查找嵌套在多层容器中的按钮
     * const btnAttack = no.getChildByNameRecursion(this.node, 'BtnAttack');
     * 
     * // 在角色装备树中查找特定部件
     * const weaponSlot = no.getChildByNameRecursion(characterNode, 'WeaponSlot');
     * 
     * // 查找场景中的特效节点
     * const fireEffect = no.getChildByNameRecursion(sceneRoot, 'FireEffect');
     */
    export function getChildByNameRecursion(self: Node, nodeName: string): Node | null {
        let c = self.getChildByName(nodeName);
        if (!c) {
            for (let i = 0, n = self.children.length; i < n; i++) {
                c = getChildByNameRecursion(self.children[i], nodeName);
                if (c) break;
            }
        }
        return c;
    }


    /**
     * 获取指定layer的相机
     * @param layer 对应node.layer
     */
    export function getCamera(layer: number): rendererCamera {
        const cameras = director.getScene().scene.renderScene.cameras;
        for (let i = 0; i < cameras.length; i++) {
            const camera = cameras[i];
            if (camera.visibility & layer) {
                return camera;
            }
        }
        return null;
    }

    /**
     * 设置节点及子节点层级
     * @param node 
     * @param layer 
     */
    export function setLayer(node: Node, layer: number) {
        if (!node || node.layer == layer) return;
        node.layer = layer;
        for (let child of node.children) {
            setLayer(child, layer);
        }
    }

    let _viewSizeCache: { width: number, height: number };
    /**
     * 获取视口大小
     * @returns 视口大小
     */
    export function viewSize() {
        if (!_viewSizeCache) {
            _viewSizeCache = { width: view.getVisibleSize().width, height: view.getVisibleSize().height };
        }
        return _viewSizeCache;
    }

    /**
     * 是否竖屏
     * @returns 是否竖屏
     */
    export function isPortrait() {
        const { width, height } = viewSize();
        return height > width;
    }

    /**
     * 是否横屏
     * @returns 是否横屏
     */
    export function isLandscape() {
        return !isPortrait();
    }

    /**
     * 设备是否有安全区域
     * @returns 
     */
    export function hasSafeArea() {
        const rect = sys.getSafeAreaRect();
        const size = viewSize();
        return rect.height < size.height;
    }

    /**
     * 创建基础UI节点（默认添加UITransform组件）
     * @param name 节点名称（可选）
     * @param components 需要预添加的组件列表（支持组件类或组件名）
     * @returns 配置好的节点对象
     * @example
     * // 创建带Sprite和Button组件的节点
     * const node = newNode('MenuButton', [Sprite, 'YJButton']);
     * 
     * // 创建仅带UITransform的空白节点
     * const container = newNode('ScrollContent');
     */
    export function newNode(name?: string, components?: typeof Component[] | string[]): Node {
        const n = newComponentNode(name, components);
        n.layer = Layers.Enum.UI_2D;
        n.addComponent(UITransform);
        return n;
    }

    /**
     * 创建组件节点
     * @param name 节点名称
     * @param components 需要预添加的组件列表（支持组件类或组件名）
     * @returns 配置好的节点对象
     */
    export function newComponentNode(name: string, components: typeof Component[] | string[]): Node {
        const n = new Node(name);
        if (components) {
            for (let i = 0; i < components.length; i++) {
                n.addComponent(components[i] as any);
            }
        };
        return n;
    }

    /**
     * 启用组件
     * @param node 节点
     * @param comp 组件类型或组件名
     */
    export function componentEnable(node: Node, comp: typeof Component | string): void {
        if (!node) return;
        let c = node.getComponent(comp as any);
        if (c)
            c.enabled = true;
        else node.addComponent(comp as any);
    }

    /**
     * 禁用组件
     * @param node 节点
     * @param comp 组件类型或组件名
     */
    export function componentDisable(node: Node, comp: typeof Component | string): void {
        if (!node) return;
        let c = node.getComponent(comp as any);
        if (c)
            c.enabled = false;
    }
}