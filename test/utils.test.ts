import { Utils } from '../src/utils';

test('utils crc32', (): void => {
  const v = Utils.crc32('/v1/session/init');
  expect(v).toBe(1897767088);
});

test('utils str2ab and ab2str', (): void => {
  expect(Utils.ab2str(Utils.str2ab('test'))).toBe('test');
});

test('utils encrypt and decrypt', (): void => {
  const key = 'b8ca9aa66def05ff3f24919274bb4a66';
  const iv = key;
  expect(Utils.decrypt(Utils.encrypt('test', key, iv), key, iv)).toBe('test');
});

test('utils binToBase64 and base64ToBin', (): void => {
  expect(Utils.binToBase64(Utils.base64ToBin('test'))).toBe('test');
});

test('utils stringToBin and binToString', (): void => {
  expect(Utils.binToString(Utils.stringToBin('test'))).toBe('test');
});
