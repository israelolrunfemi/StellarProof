import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { IStorageProvider, StorageError, UploadResult } from '../types/storage.types';

/**
 * IPFS Storage Provider
 * Handles file uploads to IPFS using ipfs-http-client
 */
class IpfsService implements IStorageProvider {
  private client: IPFSHTTPClient | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const ipfsApiUrl = process.env.IPFS_API_URL;
    
    if (!ipfsApiUrl) {
      throw new StorageError(
        'ipfs',
        'initialization',
        'Missing required IPFS environment variable: IPFS_API_URL (e.g., http://localhost:5001 or https://ipfs.infura.io:5001)',
        500,
      );
    }

    try {
      const apiKey = process.env.IPFS_API_KEY;
      const authHeader = apiKey ? `Basic ${Buffer.from(apiKey).toString('base64')}` : undefined;

      this.client = create({
        url: ipfsApiUrl,
        headers: authHeader ? { authorization: authHeader } : undefined,
      });
    } catch (error) {
      throw new StorageError(
        'ipfs',
        'initialization',
        `Failed to initialize IPFS client: ${error instanceof Error ? error.message : String(error)}`,
        500,
      );
    }
  }

  async upload(buffer: Buffer, mimetype: string, originalname: string): Promise<UploadResult> {
    if (!this.client) {
      throw new StorageError(
        'ipfs',
        'upload',
        'IPFS client is not initialized',
        500,
      );
    }

    try {
      // Upload to IPFS
      const result = await this.client.add(
        {
          content: buffer,
          path: originalname,
        },
        {
          progress: undefined, // Disable progress reporting for API context
          wrapWithDirectory: false,
        },
      );

      // Get the last result (the file itself)
      const uploadResult = Array.isArray(result) ? result[result.length - 1] : result;

      if (!uploadResult.cid) {
        throw new StorageError(
          'ipfs',
          'upload',
          'No CID returned from IPFS',
          502,
        );
      }

      const cid = uploadResult.cid.toString();
      const gatewayUrl = this.constructGatewayUrl(cid);

      return {
        provider: 'ipfs',
        url: gatewayUrl,
        cid,
        size: buffer.length,
        mimetype,
        uploadedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError(
        'ipfs',
        'upload',
        `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
        502,
      );
    }
  }

  /**
   * Construct a gateway URL for the given CID
   * Prioritizes configured gateway, falls back to public gateway
   */
  private constructGatewayUrl(cid: string): string {
    const customGateway = process.env.IPFS_GATEWAY_URL;
    
    if (customGateway) {
      return `${customGateway}/ipfs/${cid}`;
    }

    // Default to dweb.link public gateway
    return `https://dweb.link/ipfs/${cid}`;
  }
}

export const ipfsService = new IpfsService();
