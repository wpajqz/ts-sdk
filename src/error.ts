export class WebsocketError {
  private _code: number;
  private _msg: string;

  /**
   * 构造函数
   */
  public constructor(code: number, msg: string) {
    this._code = code;
    this._msg = msg;
  }

  /**
   * 返回错误码
   */
  public get code(): number {
    return this._code;
  }

  /**
   * 返回具体的错误信息
   */
  public get msg(): string {
    return this._msg;
  }
}
