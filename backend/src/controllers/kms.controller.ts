import { Request, Response, NextFunction } from 'express';
import { kmsService } from '../services/kms.service';

const logger = {
  error: (msg: string, error?: any) => console.error(msg, error || ''),
};

export class KMSController {
  async createKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { metadata } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }
      
      const plaintextKey = kmsService.generateKey();
      const storedKey = await kmsService.storeKey(userId, plaintextKey, metadata);
      
      res.status(201).json({
        success: true,
        data: {
          keyId: storedKey._id,
          keyVersion: storedKey.keyVersion,
          algorithm: storedKey.algorithm,
          isActive: storedKey.isActive,
          createdAt: storedKey.createdAt,
        },
        message: 'Key created successfully',
      });
    } catch (error) {
      logger.error('Error creating key:', error);
      next(error);
    }
  }

  async getKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { keyId } = req.params;
      const decryptedKey = await kmsService.retrieveKey(keyId);
      
      res.status(200).json({
        success: true,
        data: {
          keyId: decryptedKey.keyId,
          keyVersion: decryptedKey.keyVersion,
          key: decryptedKey.key,
        },
      });
    } catch (error) {
      logger.error('Error retrieving key:', error);
      next(error);
    }
  }

  async listKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const keys = await kmsService.listKeys(userId);
      
      res.status(200).json({
        success: true,
        data: keys,
        count: keys.length,
      });
    } catch (error) {
      logger.error('Error listing keys:', error);
      next(error);
    }
  }

  async deleteKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { keyId } = req.params;
      await kmsService.deleteKey(keyId);
      
      res.status(200).json({
        success: true,
        message: 'Key deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting key:', error);
      next(error);
    }
  }

  async deactivateKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { keyId } = req.params;
      await kmsService.deactivateKey(keyId);
      
      res.status(200).json({
        success: true,
        message: 'Key deactivated successfully',
      });
    } catch (error) {
      logger.error('Error deactivating key:', error);
      next(error);
    }
  }

  async rotateKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { keyId } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }
      
      const result = await kmsService.rotateKey(keyId, userId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Key rotated successfully',
      });
    } catch (error) {
      logger.error('Error rotating key:', error);
      next(error);
    }
  }
}

export const kmsController = new KMSController();