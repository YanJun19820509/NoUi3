import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('YJProtobuf')
export class YJProtobuf {
    private _root: any;
    private dataName: string;

    public static new(name: string, protoDefine: string): YJProtobuf;
    public static new(name: string, obj: any): YJProtobuf;
    public static new(name: string, obj: any): YJProtobuf {
        return new YJProtobuf(name, obj);
    }

    constructor(name: string, protoDefine: string);
    constructor(name: string, obj: any);
    constructor(name: string, obj: any) {
        this.init(name, obj);
    }

    public init(name: string, protoDefine: string): void;
    public init(name: string, obj: any): void;
    public init(name: string, obj: any): void {
        let pbd: string;
        if (typeof obj == 'object') {
            pbd = YJProtobuf.createProtoDefine(obj, name, `${name}package`);
        } else {
            pbd = obj;
        }
        this._root = window['protobuf'].parse(pbd, { keepCase: true }).root;
        this.dataName = name;
    }

    public encode(data: any): Uint8Array {
        let msg_type = this._root.lookupType(`${this.dataName}package.${this.dataName}`);
        let err = msg_type.verify(data);
        if (err) {
            return err;
        }
        let msg = msg_type.create(data);
        return msg_type.encode(msg).finish();
    }

    public decode(buffer: Uint8Array): any {
        let msg_type = this._root.lookupType(`${this.dataName}package.${this.dataName}`);
        let msg = msg_type.decode(buffer);
        return msg_type.toObject(msg);
    }


    public static createProtoDefine(jsonObject: any, objectName: string, pkgName: string): string {
        let df = `package ${pkgName};
        syntax = "proto3";`;
        this.createMessage(objectName, jsonObject, df);
        return df;
    }

    private static createMessage(msgName: string, msgObject: any, protoDefine: string) {
        let s = '', id = 1;
        for (const key in msgObject) {
            let v = msgObject[key];
            let datatype = typeof v;
            s += `${this.createAttr(key, datatype, v, id, protoDefine)}\n`;
            id++;
        }
        protoDefine += `
            message ${msgName}
            {
                ${s}}
        `;
    }

    private static createAttr(key: string, datatype: string, value: any, id: number, protoDefine: string): string {
        let t = '', pre = 'optional';
        switch (datatype) {
            case 'bigint':
                t = 'int64';
                break;
            case 'boolean':
                t = 'bool';
                break;
            case 'number':
                if (`${value}`.indexOf('.') != -1) t = 'double';
                else t = 'int32';
                break;
            case 'string':
                t = 'string';
                break;
            case 'object'://数组
                if (value instanceof Array) {
                    return `repeated ${this.createAttr(key, typeof value[0], value[0], id, protoDefine)}`;
                } else if (value instanceof Object) {
                    let name = `msg_${key}`;
                    this.createMessage(name, value, protoDefine);
                    return `${pre} ${name} ${key} = ${id};`
                }
                break;
        }
        return `${pre} ${t} ${key} = ${id};`;
    }
}