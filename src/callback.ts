export interface readyStateCallback {
  onOpen(ev: Event);
  onError(ev: Event);
  onClose(ev: Event);
}

export interface callback {
  onStart();
  onSuccess(data: string);
  onError(code: number, message: string);
  onEnd();
}
