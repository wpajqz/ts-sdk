interface ReadyStateCallback {
  onOpen(ev: Event): void;
  onError(ev: Event): void;
  onClose(ev: Event): void;
}

interface RequestCallback {
  onStart(): void;
  onSuccess(data: string): void;
  onError(code: number, message: string): void;
  onEnd(): void;
}

export { ReadyStateCallback, RequestCallback };
