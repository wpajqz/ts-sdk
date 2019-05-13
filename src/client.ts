import { Packet } from './packet';
import { Utils } from './utils';
import { ReadyStateCallback } from './types/callback';
import { WebsocketError } from './error';

const clientError = 400;

/**
 * 初始化链接以及收发数据
 */
class Client {
  private _maxPayload: number;
  private _enableLogger: boolean;
  private listeners: Map<number, (data: string) => void>;
  private requestHeader: string;
  private responseHeader: string;
  private url: string;
  private reconnectTimes: number;
  private reconnectLock: boolean;
  private socket: WebSocket;
  private readyStateCallback: ReadyStateCallback;

  /**
   * 构造函数，初始化客户端链接
   * @param url websocket链接地址
   * @param readyStateCallback 链接状态回调，可以处理onOpen、onClose、onError
   */
  public constructor(url: string, readyStateCallback: ReadyStateCallback) {
    this.listeners = new Map<number, (data: string) => void>();
    this.requestHeader = '';
    this.requestHeader = '';
    this._maxPayload = 1024 * 1024;
    this.url = url;
    this.reconnectTimes = 0;
    this.readyStateCallback = readyStateCallback;
    this._enableLogger = false;
    this.socket = this.connect();
  }

  /**
   * 设置可以处理的数据包上限
   * @param maxPayload 最多可以处理的数据包大小
   */
  public set maxPayload(maxPayload: number) {
    this._maxPayload = maxPayload;
  }

  /**
   * 获取可以处理的数据包大小
   */
  public get maxPayload(): number {
    return this._maxPayload;
  }

  /**
   * 设置是否允许显示运行日志
   */
  public set enableLogger(enableLogger: boolean) {
    this._enableLogger = enableLogger;
  }

  /**
   * 获取是否显示日志的配置信息
   */
  public get enableLogger(): boolean {
    return this._enableLogger;
  }

  /**
   * 发送ping请求，来保持长连接
   * @param param 请求参数,比如{"hello":"world"}
   */
  public async ping(param: object): Promise<string> {
    return new Promise(
      (
        resolve: (data: string) => void,
        reject: (err: WebsocketError) => void,
      ): void => {
        if (this.socket.readyState !== this.socket.OPEN) {
          if (this._enableLogger) {
            console.log('[ping]: connection refuse');
          }

          reject(new WebsocketError(clientError, 'connection refuse'));
        }

        const heartbeatOperator = 0;

        this.listeners.set(
          heartbeatOperator,
          (data: string): void => {
            const code = this.getResponseProperty('code');
            if (code !== '') {
              const message = this.getResponseProperty('message');
              reject(new WebsocketError(Number(code), message));
            } else {
              resolve(data);
            }
          },
        );

        const p = new Packet();
        this.send(
          p.pack(
            heartbeatOperator,
            0,
            this.requestHeader,
            JSON.stringify(param),
          ),
        );

        if (this._enableLogger) {
          console.info(
            '[send data packet]',
            heartbeatOperator,
            0,
            this.requestHeader,
            param,
          );
        }
      },
    );
  }

  /**
   * 同步方式向服务端发送请求
   * @param operator 路由地址
   * @param param 请求参数，比如{"hello":"world"}
   * @param callback 请求状态回调处理
   */
  public async request(operator: string, param: object): Promise<string> {
    return await this.asyncSend(operator, param);
  }

  /**
   * 添加消息监听
   * @description 添加消息监听器，比如operator是/v1/message/listener，那么从服务端推送到/v1/message/listener的消息会进入到定义的listener里面进行处理
   * @param operator 消息监听地址
   * @param listener 定义如何处理从服务端返回的消息
   */
  public addMessageListener(
    operator: string,
    listener: (data: string) => void,
  ): void {
    this.listeners.set(Utils.crc32(operator), listener);
  }

  /**
   * 移除消息监听
   * @param operator 消息监听地址
   */
  public removeMessageListener(operator: string): void {
    delete this.listeners[Utils.crc32(operator)];
  }

  /**
   * 返回Websocket链接状态
   * @returns Websocket的链接状态
   */
  public get readyState(): number {
    return this.socket.readyState;
  }

  /**
   * 添加请求属性，会携带在数据帧里面发送到服务端
   * @param key 属性名
   * @param value 属性值
   */
  public setRequestProperty(key: string, value: string): void {
    let v = this.getRequestProperty(key);

    this.requestHeader = this.requestHeader.replace(key + '=' + v + ';', '');
    this.requestHeader = this.requestHeader + key + '=' + value + ';';
  }

  /**
   * 获取请求属性
   * @param key 属性名
   */
  public getRequestProperty(key: string): string {
    if (this.requestHeader !== undefined) {
      let values = this.requestHeader.split(';');
      for (let index in values) {
        let kv = values[index].split('=');
        if (kv[0] === key) {
          return kv[1];
        }
      }
    }

    return '';
  }

  /**
   * 设置响应属性，客户端基本用不到，都是服务端来进行设置
   * @param key 属性名
   * @param value 属性值
   */
  public setResponseProperty(key: string, value: string): void {
    let v = this.getResponseProperty(key);

    this.responseHeader = this.responseHeader.replace(key + '=' + v + ';', '');
    this.responseHeader = this.responseHeader + key + '=' + value + ';';
  }

  /**
   * 获取从服务端返回的属性
   * @param key 获取响应属性
   */
  public getResponseProperty(key: string): string {
    if (this.responseHeader !== undefined) {
      let values = this.responseHeader.split(';');
      for (let index in values) {
        let kv = values[index].split('=');
        if (kv[0] === key) {
          return kv[1];
        }
      }
    }

    return '';
  }

  /**
   * 创建websocket链接
   */
  private connect(): WebSocket {
    const readyStateCallback = this.readyStateCallback;
    let ws = new WebSocket(this.url);

    ws.binaryType = 'blob';

    ws.onopen = (ev): void => {
      if (this._enableLogger) {
        console.info('[websocket] open connection');
      }

      this.reconnectTimes = 0;

      readyStateCallback.onOpen(ev);
    };

    ws.onclose = (ev): void => {
      if (this._enableLogger) {
        console.info('[websocket] close connection');
      }

      this.reconnect();

      readyStateCallback.onClose(ev);
    };

    ws.onerror = (ev): void => {
      if (this._enableLogger) {
        console.info('[websocket] error');
      }

      this.reconnect();

      readyStateCallback.onError(ev);
    };

    ws.onmessage = (ev): void => {
      if (ev.data instanceof Blob) {
        let reader = new FileReader();
        reader.readAsArrayBuffer(ev.data);
        reader.onload = (): void => {
          try {
            let packet = new Packet().unPack(reader.result as ArrayBuffer);
            let packetLength = packet.headerLength + packet.bodyLength + 20;
            if (packetLength > this._maxPayload) {
              throw new Error('the packet is big than ' + this._maxPayload);
            }

            let operator = Number(packet.operator) + Number(packet.sequence);
            if (this.listeners.has(operator)) {
              if (packet.body === '') {
                packet.body = '{}';
              }

              this.responseHeader = packet.header;

              (this.listeners.get(operator) as (data: string) => void)(
                JSON.parse(packet.body),
              );
            }

            if (this._enableLogger) {
              if (operator !== 0 && packet.body !== 'null') {
                console.info('receive data packet', packet.body);
              }
            }
          } catch (e) {
            throw new Error(e);
          }
        };
      } else {
        throw new Error('unsupported data format');
      }
    };

    return ws;
  }

  /**
   * 断线重连
   */
  private reconnect(): void {
    if (!this.reconnectLock) {
      this.reconnectLock = true;
      if (this._enableLogger) {
        console.info('websocket reconnect in ' + this.reconnectTimes + 's');
      }

      // 尝试重连
      setTimeout((): void => {
        this.reconnectTimes++;
        this.socket = this.connect();
        this.reconnectLock = false;
      }, this.reconnectTimes * 1000);
    }
  }

  /**
   * 向服务端发送数据请求
   * @param data 向服务端传送的数据
   */
  private send(data: ArrayBuffer): void {
    if (this.socket.readyState !== this.socket.OPEN) {
      if (this._enableLogger) {
        console.error(
          '[send] WebSocket is already in CLOSING or CLOSED state.',
        );
      }

      return;
    }

    try {
      this.socket.send(data);
    } catch (e) {
      throw new Error('send data error' + e);
    }
  }

  /**
   * 异步向服务端发送请求
   * @param operator 路由地址
   * @param param 请求参数，比如{"hello":"world"}
   * @param callback 请求状态回调处理
   */
  private asyncSend(operator: string, param: object): Promise<string> {
    return new Promise(
      (
        resolve: (data: string) => void,
        reject: (err: WebsocketError) => void,
      ): void => {
        if (this.socket.readyState !== this.socket.OPEN) {
          if (this._enableLogger) {
            console.log('[ping]: connection refuse');
          }

          reject(
            new WebsocketError(clientError, 'asyncSend: connection refuse'),
          );
        }

        const sequence = new Date().getTime();
        const listener = Utils.crc32(operator) + sequence;
        this.listeners.set(
          listener,
          (data: string): void => {
            const code = this.getResponseProperty('code');
            if (code !== '') {
              const message = this.getResponseProperty('message');
              reject(new WebsocketError(Number(code), message));
            } else {
              resolve(data);
            }

            delete this.listeners[listener];
          },
        );

        const p = new Packet();
        this.send(
          p.pack(
            Utils.crc32(operator),
            sequence,
            this.requestHeader,
            JSON.stringify(param),
          ),
        );

        if (this._enableLogger) {
          console.info(
            '[send data packet]',
            operator,
            sequence,
            this.requestHeader,
            param,
          );
        }
      },
    );
  }
}

export { Client };
