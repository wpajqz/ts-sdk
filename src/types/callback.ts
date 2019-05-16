export interface ReadyStateCallback {
  onOpen(ev: Event): void;
  onError(ev: Event): void;
  onClose(ev: Event): void;
}
