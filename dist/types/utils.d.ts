declare class Utils {
    private static code;
    static crc32(str: string): number;
    static ab2str(buf: ArrayBuffer): string;
    static str2ab(str: string): ArrayBuffer;
    static decrypt(data: any, key: any, iv: any): any;
    static encrypt(data: any, key: any, iv: any): string;
    static binToBase64(bitString: any): string;
    static base64ToBin(str: any): string;
    static stringToBin(str: string): string;
    static binToStr(bin: string): string;
}
export { Utils };
