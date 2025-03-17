

/**
 * Predefined variables
 * Name = YJWebSocketInterface
 * DateTime = Thu Aug 18 2022 17:47:29 GMT+0800 (中国标准时间)
 * Author = mqsy_yj
 * FileBasename = YJWebSocketInterface.ts
 * FileBasenameNoExtension = YJWebSocketInterface
 * URL = db://assets/NoUi3/network/YJWebSocketInterface.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */


export interface YJSocketInterface {
    /**
     * 发送数据到服务器
     * @param data 要发送的数据（支持任意可序列化类型）
     * @example
     * socket.sendDataToServer({ command: 'login', user: 'test' });
     */
    sendDataToServer(data: any): any;

    /**
     * 从服务器获取数据（可选实现）
     * @param data 请求参数
     * @returns 返回Promise对象，解析服务器响应数据
     * @example
     * socket.getDataFromServer({ id: 1001 })
     *   .then(response => console.log(response));
     */
    getDataFromServer?(data: any): Promise<any>;

    /**
     * 查找符合条件的数据包（可选实现）
     * @param handler 数据包验证函数，返回true表示找到目标数据
     * @example
     * socket.findReceiveData(pkg => pkg.type === 'chat');
     */
    findReceiveData?(handler: (data: any) => boolean): void;

    /**
     * 处理接收到的数据（可选实现）
     * @param handler 数据处理回调函数
     * @example
     * socket.dealReceivedData(data => {
     *   console.log('收到数据:', data);
     * });
     */
    dealReceivedData?(handler: (data: any) => void): void;

    /**
     * 消息接收回调（可选）
     * @param v 接收到的消息内容
     */
    onMessage?(v: any): any;

    /**
     * 连接关闭回调（可选）
     * @example
     * socket.onClose = () => console.log('连接已断开');
     */
    onClose?(): void;

    /**
     * 连接成功回调（可选）
     * @example
     * socket.onConnect = () => console.log('连接已建立');
     */
    onConnect?(): void;

    /**
     * 清理连接资源
     * @example
     * socket.clear(); // 重置所有回调并断开连接
     */
    clear?(): void;

    /**
     * 建立连接
     * @example
     * socket.connect(); // 开始连接服务器
     */
    connect?(): void;

    /**
     * 关闭连接
     * @example
     * socket.close(); // 主动断开连接
     */
    close?(): void;

    /**
     * 设置请求头（适用于需要鉴权的连接）
     * @param key 头字段名称
     * @param value 头字段值
     * @example
     * socket.setHeader('Authorization', 'Bearer token123');
     */
    setHeader?(key: string, value: string): void;

    /**
     * 检查连接状态
     * @returns 返回当前是否处于连接状态
     * @example
     * if(socket.isOpen()) {
     *   // 执行需要连接的操作
     * }
     */
    isOpen?(): boolean;
}
