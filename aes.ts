import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const algorithm = 'aes256';
const blocksize = 16;

/**
 * Encrypt a buffer with AES-256 encryption
 * @param aesKey Must be 32 bytes long
 */
export const encryptBufferWithAESKey = (
  bufferToEncrypt: Buffer,
  aesKey: string
) => {
  const key = Buffer.from(aesKey, 'latin1');

  // Generate a random initial vector
  const iv = randomBytes(blocksize);

  const cipher = createCipheriv(algorithm, key, iv);

  // Encrypt buffer contents
  let ciphertext = cipher.update(bufferToEncrypt);
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);

  // Return a new buffer that includes the initial vector and ciphertext
  return Buffer.concat([iv, ciphertext]);
};

/**
 * Decrypt an AES-256 encrypted buffer
 * @param aesKey Must be 32 bytes long
 */
export const decrpytBufferWithAESKey = (
  bufferToDecrypt: Buffer,
  aesKey: string
) => {
  const key = Buffer.from(aesKey, 'latin1');

  // Resolve initial vector from buffer, it is the first 16 bytes
  let iv = Buffer.alloc(blocksize);
  bufferToDecrypt.copy(iv, 0, 0, blocksize);

  // Resolve ciphertext from buffer, it is everything but the first 16 bytes
  let ciphertext = Buffer.alloc(bufferToDecrypt.length - blocksize);
  bufferToDecrypt.copy(ciphertext, 0, blocksize);

  const decipher = createDecipheriv(algorithm, key, iv);

  // Decrypt ciphertext into buffer
  let plaintext = decipher.update(ciphertext);
  plaintext = Buffer.concat([plaintext, decipher.final()]);

  return plaintext;
};
