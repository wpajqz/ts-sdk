import { Utils } from '../src/utils';

test('object assignment', () => {
  const v = Utils.crc32('/v1/session/init');
  console.log(v);
});
