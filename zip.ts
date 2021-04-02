import { promisify } from 'util';
import { deflate, inflate } from 'zlib';

const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);

export const compressBuffer = (bufferToCompress: Buffer): Promise<Buffer> =>
  deflateAsync(bufferToCompress) as Promise<any>;

export const uncompressBuffer = (bufferToUncompress: Buffer): Promise<Buffer> =>
  inflateAsync(bufferToUncompress) as Promise<any>;
