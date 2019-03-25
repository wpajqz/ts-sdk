export interface readyStateCallback {
  onopen(ev: Event);
  onerror(ev: Event);
  onclose(ev: Event);
}

export interface callback {
  onStart();
  onSuccess(data: string);
  onError(code: number, message: string);
  onEnd();
}
