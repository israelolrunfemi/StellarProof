import crypto from 'crypto';
import KMSKeyModel from '../models/KMSKey.model';
import mongoose from 'mongoose';

export interface EncryptedData {
  iv: string;
  encryptedKeyValue: string;
}

export interface DecryptedData {
  key: string;
  keyId: string;
  keyVersion: string;
}

const logger = {
  info: (msg: string, data?: any) => console.log(msg, data || ''),
  error: (msg: string, error?: any) => console.error(msg, error || ''),
  warn: (msg: string, data?: any) => console.warn(msg, data || ''),
};

export class KMSService {
  private readonly algorithm: string = 'aes-256-gcm';
  private readonly encoding: BufferEncoding = 'hex';
  private masterKey: Buffer;

  constructor() {
    const masterKeyString = process.env.MASTER_KEY;
    
    if (!masterKeyString) {
      throw new Error('MASTER_KEY environment variable is not set');
    }
    
    this.masterKey = crypto.createHash('sha256').update(masterKeyString).digest();
  }

  generateKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  encryptKey(plaintextKey: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(plaintextKey, 'utf8'),
        cipher.final()
      ]);
      
      return {
        iv: iv.toString(this.encoding),
        encryptedKeyValue: encrypted.toString(this.encoding),
      };
    } catch (error) {
      logger.error('Failed to encrypt key:', error);
      throw new Error('Key encryption failed');
    }
  }

  decryptKey(encryptedData: EncryptedData): string {
    try {
      const iv = Buffer.from(encryptedData.iv, this.encoding);
      const encryptedBuffer = Buffer.from(encryptedData.encryptedKeyValue, this.encoding);
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      
      const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Failed to decrypt key:', error);
      throw new Error('Key decryption failed');
    }
  }

  async storeKey(
    creatorId: string,
    plaintextKey: string,
    metadata?: { keyVersion?: string; expiresAt?: Date }
  ): Promise<any> {
    try {
      const encrypted = this.encryptKey(plaintextKey);
      
      const kmsKey = await KMSKeyModel.create({
        creatorId: new mongoose.Types.ObjectId(creatorId),
        keyVersion: metadata?.keyVersion || 'v1',
        algorithm: this.algorithm,
        encryptedKeyValue: encrypted.encryptedKeyValue,
        iv: encrypted.iv,
        isActive: true,
        expiresAt: metadata?.expiresAt || null,
      });
      
      logger.info(`Key stored successfully: ${kmsKey._id}`);
      return kmsKey;
    } catch (error) {
      logger.error('Failed to store key:', error);
      throw new Error('Key storage failed');
    }
  }

  async retrieveKey(keyId: string): Promise<DecryptedData> {
    try {
      const kmsKey = await KMSKeyModel.findById(keyId);
      
      if (!kmsKey) {
        throw new Error(`Key not found: ${keyId}`);
      }
      
      if (!kmsKey.isActive) {
        throw new Error(`Key is inactive: ${keyId}`);
      }
      
      if (kmsKey.expiresAt && new Date() > kmsKey.expiresAt) {
        throw new Error(`Key has expired: ${keyId}`);
      }
      
      const decryptedKey = this.decryptKey({
        iv: kmsKey.iv,
        encryptedKeyValue: kmsKey.encryptedKeyValue,
      });
      
      logger.info(`Key retrieved successfully: ${keyId}`);
      
      return {
        key: decryptedKey,
        keyId: kmsKey._id.toString(),
        keyVersion: kmsKey.keyVersion,
      };
    } catch (error) {
      logger.error('Failed to retrieve key:', error);
      throw error;
    }
  }

  async deleteKey(keyId: string): Promise<boolean> {
    try {
      const result = await KMSKeyModel.findByIdAndDelete(keyId);
      
      if (!result) {
        throw new Error(`Key not found: ${keyId}`);
      }
      
      logger.info(`Key deleted successfully: ${keyId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete key:', error);
      throw error;
    }
  }

  async deactivateKey(keyId: string): Promise<boolean> {
    try {
      const result = await KMSKeyModel.findByIdAndUpdate(
        keyId,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
      
      if (!result) {
        throw new Error(`Key not found: ${keyId}`);
      }
      
      logger.info(`Key deactivated successfully: ${keyId}`);
      return true;
    } catch (error) {
      logger.error('Failed to deactivate key:', error);
      throw error;
    }
  }

  async listKeys(creatorId?: string): Promise<any[]> {
    try {
      const filter: any = {};
      if (creatorId) {
        filter.creatorId = new mongoose.Types.ObjectId(creatorId);
      }
      
      const keys = await KMSKeyModel.find(filter, {
        encryptedKeyValue: 0,
      }).sort({ createdAt: -1 });
      
      return keys;
    } catch (error) {
      logger.error('Failed to list keys:', error);
      throw new Error('Failed to retrieve key list');
    }
  }

  async rotateKey(keyId: string, creatorId: string): Promise<any> {
    try {
      const oldKey = await KMSKeyModel.findById(keyId);
      
      if (!oldKey) {
        throw new Error(`Key not found: ${keyId}`);
      }
      
      // Deactivate old key
      await this.deactivateKey(keyId);
      
      // Generate new key
      const newPlaintextKey = this.generateKey();
      const newKeyVersion = `v${parseInt(oldKey.keyVersion.replace('v', '')) + 1}`;
      
      // Store new key
      const newKey = await this.storeKey(creatorId, newPlaintextKey, {
        keyVersion: newKeyVersion,
      });
      
      logger.info(`Key rotated successfully: ${keyId} -> ${newKey._id}`);
      return {
        oldKey: { id: oldKey._id, version: oldKey.keyVersion, isActive: false },
        newKey: { id: newKey._id, version: newKey.keyVersion, isActive: true },
      };
    } catch (error) {
      logger.error('Failed to rotate key:', error);
      throw error;
    }
  }
}

export const kmsService = new KMSService();