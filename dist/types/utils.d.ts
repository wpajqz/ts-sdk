declare global {
    interface Window {
        crcTable: number[];
    }
}
declare class Utils {
    private static code;
    static crc32(str: string): number;
    static ab2str(buf: ArrayBuffer): string;
    static str2ab(str: string): ArrayBuffer;
    static decrypt(data: string, key: string, iv: string): string;
    static encrypt(data: string, key: string, iv: string): string;
    static binToBase64(bitString: string): string;
    static base64ToBin(str: string): string;
    static stringToBin(str: string): string;
    static binToString(bin: string): string;
    private static makeCRCTable;
}
export { Utils };
