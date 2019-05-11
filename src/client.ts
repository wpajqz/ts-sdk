import { Packet } from './packet';
import { Utils } from './utils';
import { ReadyStateCallback, RequestCallback } from './types/callback';

/**
 * 初始化链接以及收发数据
 */
class Client {
  private _maxPayload: number;
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
    this.socket = this.connect();
  }

  /**
   * 发送ping请求，来保持长连接
   * @param param 请求参数,比如{"hello":"world"}
   * @param requestCallback 请求状态回调
   */
  public ping(param: object, requestCallback: RequestCallback): void {
    if (this.socket.readyState !== this.socket.OPEN) {
      throw new Error('asyncSend: connection refuse');
    }

    const heartbeatOperator = 0;

    this.listeners.set(
      heartbeatOperator,
      (data: string): void => {
        const code = this.getResponseProperty('code');
        if (code !== '') {
          const message = this.getResponseProperty('message');
          requestCallback.onError(Number(code), message);
        } else {
          requestCallback.onSuccess(data);
        }

        requestCallback.onEnd();
      },
    );

    const p = new Packet();
    this.send(
      p.pack(heartbeatOperator, 0, this.requestHeader, JSON.stringify(param)),
    );
  }

  /**
   * 异步向服务端发送请求
   * @param operator 路由地址
   * @param param 请求参数，比如{"hello":"world"}
   * @param callback 请求状态回调处理
   */
  public asyncSend(
    operator: string,
    param: object,
    callback: RequestCallback,
  ): void {
    console.info('websocket send data', operator, this.requestHeader, param);

    if (this.socket.readyState !== this.socket.OPEN) {
      throw new Error('asyncSend: connection refuse');
    }

    callback.onStart();

    const sequence = new Date().getTime();
    const listener = Utils.crc32(operator) + sequence;
    this.listeners.set(
      listener,
      (data: string): void => {
        const code = this.getResponseProperty('code');
        if (code !== '') {
          const message = this.getResponseProperty('message');
          callback.onError(Number(code), message);
        } else {
          callback.onSuccess(data);
        }

        callback.onEnd();

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
  }

  /**
   * 同步方式向服务端发送请求
   * @param operator 路由地址
   * @param param 请求参数，比如{"hello":"world"}
   * @param callback 请求状态回调处理
   */
  public async syncSend(
    operator: string,
    param: object,
    callback: RequestCallback,
  ): Promise<void> {
    await this.asyncSend(operator, param, callback);
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
      this.reconnectTimes = 0;

      readyStateCallback.onOpen(ev);
    };

    ws.onclose = (ev): void => {
      this.reconnect();

      readyStateCallback.onClose(ev);
    };

    ws.onerror = (ev): void => {
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

            if (operator !== 0 && packet.body !== 'null') {
              console.info('receive data', packet.body);
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
      console.info('websocket reconnect in ' + this.reconnectTimes + 's');
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
      console.error('WebSocket is already in CLOSING or CLOSED state.');
      return;
    }
    try {
      this.socket.send(data);
    } catch (e) {
      console.log('send data error', e);
    }
  }
}

export { Client };
