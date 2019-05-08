import * as constant from './constant';
import { ReadyStateCallback, RequestCallback } from './callback';
import { Packet } from './packet';
import { Utils } from './utils';

/**
 * Client ws client, 单例模式, 负责维护连接
 */
export class Client {
  private requestCallback: RequestCallback;
  private requestHeader: string;
  private responseHeader: string;
  private maxPayload: number;
  private url: string;
  private reconnectTimes: number;
  private reconnectLock: boolean;
  private socket: WebSocket;
  private readyStateCallback: ReadyStateCallback;

  constructor(url: string, readyStateCallback: ReadyStateCallback) {
    this.maxPayload = constant.MAX_PAYLOAD;
    this.url = url;
    this.readyStateCallback = readyStateCallback;

    this.socket = this.connect();
  }

  // 向服务端发送ping包保持长连接
  ping(param = {}, callback = {}) {
    if (typeof callback !== 'object') {
      throw new Error('callback must be an object');
    }

    if (this.socket.readyState !== this.socket.OPEN) {
      throw new Error('asyncSend: connection refuse');
    }

    let _this = this;
    this.addMessageListener(0, function(data) {
      let code = _this.getResponseProperty('code');
      if (typeof code !== 'undefined') {
        let message = _this.getResponseProperty('message');
        if (this.callback.onError !== null) {
          this.callback.onError(code, message);
        }
      } else {
        this.callback.onSuccess(data);
      }

      this.callback.onEnd();
    });

    const p = new Packet();
    _this.send(p.pack(0, 0, _this.requestHeader, JSON.stringify(param)));
  }

  send(data) {
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

  /**
   * asyncSend
   * @param {*} operator
   * @param {*} param
   * @param {*} callback 仅此次有效的callback
   */
  asyncSend(operator, param, callback) {
    console.info('websocket send data', operator, this.requestHeader, param);

    if (typeof callback !== 'object') {
      throw new Error('callback must be an object');
    }

    if (this.socket.readyState !== this.socket.OPEN) {
      throw new Error('asyncSend: connection refuse');
    }

    if (
      callback.hasOwnProperty('onStart') &&
      typeof callback.onStart === 'function'
    ) {
      callback.onStart();
    }

    let _this = this;
    let sequence = new Date().getTime();
    let listener = Utils.crc32(operator) + sequence;
    this.requestCallback[listener] = function(data) {
      let code = _this.getResponseProperty('code');
      if (typeof code !== 'undefined') {
        let message = _this.getResponseProperty('message');
        if (
          callback.hasOwnProperty('onError') &&
          typeof callback.onError === 'function'
        ) {
          callback.onError(code, message);
        }
      } else {
        if (
          callback.hasOwnProperty('onSuccess') &&
          typeof callback.onSuccess === 'function'
        ) {
          callback.onSuccess(data);
        }
      }

      if (
        callback.hasOwnProperty('onEnd') &&
        typeof callback.onEnd === 'function'
      ) {
        callback.onEnd();
      }

      delete _this.requestCallback[listener];
    };

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

  // 同步请求服务端数据
  async syncSend(operator, param, callback) {
    await this.asyncSend(operator, param, callback);
  }

  // 添加消息监听
  addMessageListener(operator, listener) {
    this.requestCallback[Utils.crc32(operator)] = listener;
  }

  // 移除消息监听
  removeMessageListener(operator) {
    delete this.requestCallback[Utils.crc32(operator)];
  }

  // 获取socket的链接状态
  getReadyState() {
    return this.socket.readyState;
  }

  // 设置单个请求能够处理的最大字节数
  setMaxPayload(maxPayload) {
    this.maxPayload = maxPayload;
  }

  // 设置请求属性
  setRequestProperty(key, value) {
    let v = this.getRequestProperty(key);

    this.requestHeader = this.requestHeader.replace(key + '=' + v + ';', '');
    this.requestHeader = this.requestHeader + key + '=' + value + ';';
  }

  // 获取请求属性
  getRequestProperty(key) {
    let values = this.requestHeader.split(';');
    for (let index in values) {
      let kv = values[index].split('=');
      if (kv[0] === key) {
        return kv[1];
      }
    }
  }

  // 设置Response属性
  setResponseProperty(key, value) {
    let v = this.getResponseProperty(key);

    this.responseHeader = this.responseHeader.replace(key + '=' + v + ';', '');
    this.responseHeader = this.responseHeader + key + '=' + value + ';';
  }

  // 获取响应属性
  getResponseProperty(key) {
    let values = this.responseHeader.split(';');
    for (let index in values) {
      let kv = values[index].split('=');
      if (kv[0] === key) {
        return kv[1];
      }
    }
  }

  // 创建连接
  connect() {
    const url = this.url;
    const readyStateCallback = this.readyStateCallback;

    let ws = new WebSocket(url);
    let _this = this;

    ws.binaryType = 'blob';

    ws.onopen = function(ev) {
      _this.reconnectTimes = 0;
      if (
        readyStateCallback.hasOwnProperty('onOpen') &&
        typeof readyStateCallback.onOpen === 'function'
      ) {
        readyStateCallback.onOpen(ev);
      }
    };

    ws.onclose = function(ev) {
      _this.reconnect();
      if (
        readyStateCallback.hasOwnProperty('onClose') &&
        typeof readyStateCallback.onClose === 'function'
      ) {
        readyStateCallback.onClose(ev);
      }
    };

    ws.onerror = function(ev) {
      _this.reconnect();
      if (
        readyStateCallback.hasOwnProperty('onError') &&
        typeof readyStateCallback.onError === 'function'
      ) {
        readyStateCallback.onError(ev);
      }
    };

    ws.onmessage = function(ev) {
      if (ev.data instanceof Blob) {
        let reader = new FileReader();
        reader.readAsArrayBuffer(ev.data);
        reader.onload = function() {
          try {
            let packet = new Packet().unPack(this.result);
            let packetLength = packet.headerLength + packet.bodyLength + 20;
            if (packetLength > constant.MAX_PAYLOAD) {
              throw new Error('the packet is big than ' + constant.MAX_PAYLOAD);
            }

            let operator = Number(packet.operator) + Number(packet.sequence);
            if (_this.requestCallback.hasOwnProperty(operator)) {
              if (packet.body === '') {
                packet.body = '{}';
              }
              _this.responseHeader = packet.header;
              _this.requestCallback[operator](JSON.parse(packet.body));
            }
            if (operator !== 0 && packet.body !== 'null') {
              console.info('receive data', packet.body);
            }
          } catch (e) {
            console.info(e);
            throw new Error(e);
          }
        };
      } else {
        throw new Error('websocket unsupported data format');
      }
    };

    return ws;
  }

  reconnect() {
    if (!this.reconnectLock) {
      this.reconnectLock = true;
      console.info('websocket reconnect in ' + this.reconnectTimes + 's');
      // 尝试重连
      setTimeout(() => {
        this.reconnectTimes++;
        this.socket = this.connect();
        this.reconnectLock = false;
      }, this.reconnectTimes * 1000);
    }
  }
}
