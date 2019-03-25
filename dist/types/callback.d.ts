export interface readyStateCallback {
    onopen(ev: Event): any;
    onerror(ev: Event): any;
    onclose(ev: Event): any;
}
export interface callback {
    onStart(): any;
    onSuccess(data: string): any;
    onError(code: number, message: string): any;
    onEnd(): any;
}
