import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as spvService from '../services/spv.service';
import Asset from '../models/Asset.model';

/**
 * SPV Controller
 */

/**
 * POST /api/v1/spv/upload
 */
export const uploadEncryptedAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, encryptedFile, accessType, allowedUsers, nftContractAddress } = req.body;

    if (!userId) {
      res.status(400).json({ status: 'error', message: 'userId is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ status: 'error', message: 'Invalid userId format' });
      return;
    }

    if (!encryptedFile) {
      res.status(400).json({
        status: 'error',
        message: 'No encrypted file data found. Ensure SPV middleware is applied.',
      });
      return;
    }

    const storageReferenceId = new mongoose.Types.ObjectId().toString();

    const asset = new Asset({
      creatorId: userId,
      fileName: encryptedFile.originalFileName,
      mimeType: encryptedFile.mimeType,
      sizeBytes: encryptedFile.size,
      storageProvider: 'cloudinary',
      storageReferenceId,
      isEncrypted: true,
      encryptionKeyVersion: encryptedFile.keyVersion,
      accessPolicy: accessType || 'private',
    });

    await asset.save();

    const kmsKey = await mongoose.model('KMSKey').findOne({
      creatorId: userId,
      keyVersion: encryptedFile.keyVersion,
      isActive: true,
    });

    if (!kmsKey) {
      res.status(404).json({ status: 'error', message: 'KMS key not found' });
      return;
    }

    const spvRecord = await spvService.createSPVRecord({
      assetId: asset._id as mongoose.Types.ObjectId,
      creatorId: new mongoose.Types.ObjectId(userId),
      kmsKeyId: kmsKey._id as mongoose.Types.ObjectId,
      accessType: accessType || 'private',
      allowedUsers: allowedUsers
        ? allowedUsers.map((id: string) => new mongoose.Types.ObjectId(id))
        : undefined,
      nftContractAddress,
      isSealed: true,
    });

    res.status(201).json({
      status: 'success',
      message: 'Encrypted asset uploaded and SPV record created successfully',
      data: {
        assetId: asset._id,
        spvRecordId: spvRecord._id,
        fileName: asset.fileName,
        isEncrypted: asset.isEncrypted,
        encryptionKeyVersion: asset.encryptionKeyVersion,
        isSealed: spvRecord.isSealed,
        accessType: spvRecord.accessType,
        createdAt: asset.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during encrypted asset upload',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/v1/spv/records/:assetId
 */
export const getSPVRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      res.status(400).json({ status: 'error', message: 'Invalid assetId format' });
      return;
    }

    const spvRecord = await spvService.getSPVRecordByAssetId(assetId);

    if (!spvRecord) {
      res.status(404).json({ status: 'error', message: 'SPV record not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: spvRecord,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching SPV record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/v1/spv/records/user/:userId
 */
export const getUserSPVRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ status: 'error', message: 'Invalid userId format' });
      return;
    }

    const spvRecords = await spvService.getSPVRecordsByUser(userId);

    res.status(200).json({
      status: 'success',
      data: {
        records: spvRecords,
        count: spvRecords.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user SPV records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * PATCH /api/v1/spv/records/:id/seal
 */
export const updateSealedStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isSealed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ status: 'error', message: 'Invalid SPV record ID format' });
      return;
    }

    if (typeof isSealed !== 'boolean') {
      res.status(400).json({ status: 'error', message: 'isSealed must be a boolean value' });
      return;
    }

    const updatedRecord = await spvService.updateSealedStatus(id, isSealed);

    res.status(200).json({
      status: 'success',
      message: `SPV record ${isSealed ? 'sealed' : 'unsealed'} successfully`,
      data: updatedRecord,
    });
  } catch (error: any) {
    if (error.message === 'SPV record not found') {
      res.status(404).json({ status: 'error', message: error.message });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating sealed status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};