

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
    sendDataToServer(data: any): any;
    getDataFromServer?(data: any): Promise<any>;
    findReceiveData?(handler: (data: any) => boolean): void;
    dealReceivedData?(handler: (data: any) => void): void;
    onMessage?(v: any): any;
    onClose?(): void;
    clear?(): void;
    connect?(): void;
    close?(): void;
    setHeader?(key: string, value: string): void;
    isOpen?(): boolean;
}
