import { readyStateCallback, callback } from './callback';
/**
 * Client ws client, 单例模式, 负责维护连接
 */
export declare class Client {
    callback: callback;
    requestHeader: string;
    responseHeader: string;
    maxPayload: number;
    url: string;
    reconnectTimes: number;
    reconnectLock: boolean;
    socket: WebSocket;
    readyStateCallback: readyStateCallback;
    constructor(url: string, readyStateCallback: readyStateCallback);
    ping(param?: {}, callback?: {}): void;
    send(data: any): void;
    /**
     * asyncSend
     * @param {*} operator
     * @param {*} param
     * @param {*} callback 仅此次有效的callback
     */
    asyncSend(operator: any, param: any, callback: any): void;
    syncSend(operator: any, param: any, callback: any): Promise<void>;
    addMessageListener(operator: any, listener: any): void;
    removeMessageListener(operator: any): void;
    getReadyState(): number;
    setMaxPayload(maxPayload: any): void;
    setRequestProperty(key: any, value: any): void;
    getRequestProperty(key: any): string;
    setResponseProperty(key: any, value: any): void;
    getResponseProperty(key: any): string;
    connect(): WebSocket;
    reconnect(): void;
}
