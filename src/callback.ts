export interface ReadyStateCallback {
  onOpen(ev: Event);
  onError(ev: Event);
  onClose(ev: Event);
}

export interface RequestCallback {
  onStart();
  onSuccess(data: string);
  onError(code: number, message: string);
  onEnd();
}
