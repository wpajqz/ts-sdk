export declare class Packet {
    private key;
    operator: number;
    sequence: number;
    headerLength: number;
    bodyLength: number;
    header: string;
    body: string;
    pack(operator: number, sequence: number, header: string, body: string): ArrayBuffer;
    unPack(data: any): Packet;
}
