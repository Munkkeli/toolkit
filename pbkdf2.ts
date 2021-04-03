import { promisify } from 'util';
import { randomBytes, pbkdf2 } from 'crypto';
import { expand, hash_length } from 'futoin-hkdf';

const pbkdf2Async = promisify(pbkdf2);

export const pbkdf2Digest = 'sha256';
export const pbkdf2SaltLength = 16;
export const pbkdf2KeyLength = 32;
export const pbkdf2Iterations = 872791;

const hkdfDigest = 'sha256';

export const generateSalt = (bytes: number = pbkdf2SaltLength) =>
  randomBytes(bytes);

export const deriveKeyFromSecret = async (
  secret: string,
  salt: Buffer,
  iterations: number = pbkdf2Iterations
) => {
  const derivedKey = await pbkdf2Async(
    secret,
    salt,
    iterations,
    pbkdf2KeyLength,
    pbkdf2Digest
  );

  return derivedKey;
};

export const expandDerivedKey = (derivedKey: Buffer, keyLength: number) => {
  const expandedKey = expand(
    hkdfDigest,
    hash_length(hkdfDigest),
    derivedKey,
    keyLength,
    ''
  );

  return expandedKey;
};
