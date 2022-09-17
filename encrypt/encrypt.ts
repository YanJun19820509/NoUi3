import { no } from "../no";
import { base64 } from "./base64";
import { YJCrypto } from "./crypto/crypto";
import { rsa } from "./rsa/rsa";

export type EncryptType = 'none' | 'base64' | 'aes' | 'rsa';
/**
 * 加密
 * @param d 
 * @param encryptType 
 * @returns 
 */
export function encode(d: string | object, encryptType: EncryptType): string | ArrayBufferLike {
    switch (encryptType) {
        case 'base64':
            return base64.encode(d);
        case 'aes':
            return YJCrypto.aesEncode(d, true);
        case 'rsa':
            return rsa.encode(d);
        default:
            return typeof d != 'string' ? JSON.stringify(d) : d;
    }
}
/**
 * 解密
 * @param d 
 * @param encryptType 
 * @returns 
 */
export function decode(d: string | ArrayBufferLike, encryptType: EncryptType): string {
    switch (encryptType) {
        case 'base64':
            return base64.decode(d);
        case 'aes':
            return YJCrypto.aesDecode(d);
        case 'rsa':
            return rsa.decode(d);
        default:
            return typeof d != 'string' ? no.arrayBuffer2String(d) : d;
    }
}