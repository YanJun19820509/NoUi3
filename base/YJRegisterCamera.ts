
import { ccclass, property, requireComponent, Component, Node, Camera, Rect } from '../yj';

/**
 * Predefined variables
 * Name = YJRegisterCamera
 * DateTime = Mon Jan 16 2023 17:39:40 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJRegisterCamera.ts
 * FileBasenameNoExtension = YJRegisterCamera
 * URL = db://assets/NoUi3/base/YJRegisterCamera.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

/**
 * 相机注册组件
 * @description 将相机实例注册到全局管理器，方便其他模块访问
 * @example
 * // 编辑器使用：
 * // 1. 添加本组件到带有Camera组件的节点
 * // 2. 在cameraName属性填写相机名称（如"main_camera"）
 * 
 * @example
 * // 代码动态注册：
 * const node = new Node('CameraNode');
 * const camera = node.addComponent(Camera);
 * node.addComponent(YJRegisterCamera).cameraName = 'dynamic_camera';
 */
@ccclass('YJRegisterCamera')
@requireComponent(Camera)
export class YJRegisterCamera extends Component {
    @property({ tooltip: '相机唯一标识名称' })
    cameraName: string = '';

    onLoad() {
        YJCameraManager.register(this.cameraName, this.getComponent(Camera));
    }
}

/**
 * 相机管理器
 * @description 提供全局相机管理功能，支持：
 * 1. 相机注册与获取
 * 2. 相机存在性检查
 * 3. 相机视口区域设置
 * 
 * @example
 * // 获取主相机并设置视口：
 * const mainCamera = YJCameraManager.getCamera('main');
 * YJCameraManager.setCameraRect('main', new Rect(0, 0, 1, 1));
 */
@ccclass('YJCameraManager')
export class YJCameraManager {
    /** 相机名称到相机实例的映射表 */
    private static _map: { [key: string]: Camera } = {};

    /**
     * 注册相机实例
     * @param name 相机唯一标识名称
     * @param camera 相机组件实例
     */
    public static register(name: string, camera: Camera) {
        this._map[name] = camera;
    }

    /**
     * 检查是否存在指定名称的相机
     * @param name 要检查的相机名称
     * @returns 是否存在对应相机
     */
    public static hasCamera(name: string): boolean {
        return !!this.getCamera(name);
    }

    /**
     * 获取指定名称的相机实例
     * @param name 要获取的相机名称
     * @returns 对应的相机实例，未找到返回null
     */
    public static getCamera(name: string): Camera {
        return this._map[name];
    }

    /**
     * 设置指定相机的视口区域
     * @param name 目标相机名称
     * @param rect 要设置的视口矩形（标准化坐标，范围0-1）
     * @example
     * // 设置分屏相机效果：
     * YJCameraManager.setCameraRect('left_camera', new Rect(0, 0, 0.5, 1));
     * YJCameraManager.setCameraRect('right_camera', new Rect(0.5, 0, 0.5, 1));
     */
    public static setCameraRect(name: string, rect: Rect) {
        let camera: Camera = this._map[name];
        if (camera) {
            camera.rect = rect;
        }
    }
}