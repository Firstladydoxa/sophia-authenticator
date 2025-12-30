import axios, { AxiosInstance, AxiosError } from 'axios';
import { createRequestSignature } from './crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiClientConfig {
  apiUrl: string;
  appId: string;
  secret: string;
  deviceId: string;
}

class CentralizedAuthApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Sync enabled MFA methods with the backend
   */
  async syncMethods(methods: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const { timestamp, signature, deviceId } = await createRequestSignature(
        this.config.deviceId,
        'sync',
        this.config.secret
      );

      const response = await this.client.post('/api/centralized-auth/sync-methods', {
        app_id: this.config.appId,
        methods: methods,
        verification_data: {
          device_id: deviceId,
          timestamp: timestamp,
          signature: signature,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error syncing methods:', error);
      return {
        success: false,
        message: 'Failed to sync methods',
      };
    }
  }

  /**
   * Verify authentication during login
   */
  async verifyLogin(data: {
    email: string;
    tempToken: string;
    method: string;
    totpCode?: string;
  }): Promise<{
    success: boolean;
    message: string;
    token?: string;
    expiresIn?: number;
  }> {
    try {
      console.log('[API] Verifying login with:', {
        baseURL: this.client.defaults.baseURL,
        endpoint: '/api/centralized-auth/verify',
        fullURL: `${this.client.defaults.baseURL}/api/centralized-auth/verify`,
        email: data.email,
        method: data.method,
        hasTotpCode: !!data.totpCode
      });

      const { timestamp, signature, deviceId } = await createRequestSignature(
        this.config.deviceId,
        data.method,
        this.config.secret
      );

      const requestBody: any = {
        email: data.email,
        app_id: this.config.appId,
        auth_method: data.method,
        auth_token: `${timestamp}:${signature}`,
        temp_token: data.tempToken,
        verification_data: {
          device_id: deviceId,
          timestamp: timestamp,
          signature: signature,
        },
      };

      // Add TOTP code if provided
      if (data.totpCode) {
        requestBody.totp_code = data.totpCode;
        console.log('[API] Including TOTP code in request');
      }

      const response = await this.client.post('/api/centralized-auth/verify', requestBody);

      console.log('[API] Verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Error verifying login:', error);
      console.error('[API] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      const message = error.response?.data?.message || error.message || 'Failed to verify authentication';
      return {
        success: false,
        message: message,
      };
    }
  }

  /**
   * Update API client configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get list of pending authentication requests for user
   */
  async getPendingAuthRequests(email: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const response = await this.client.get('/api/auth/pending', {
        params: {
          email,
          app_id: this.config.appId,
          app_secret: this.config.secret
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting pending requests:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get pending requests'
      };
    }
  }

  /**
   * Approve authentication request (new flow)
   */
  async approveAuthRequest(data: {
    session_id: string;
    auth_method: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const { timestamp, signature, deviceId } = await createRequestSignature(
        this.config.deviceId,
        data.auth_method,
        this.config.secret
      );

      const response = await this.client.post('/api/auth/approve', {
        session_id: data.session_id,
        auth_method: data.auth_method,
        device_signature: signature,
        verification_data: {
          device_id: deviceId,
          timestamp: timestamp,
          signature: signature,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Error approving auth request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to approve authentication'
      };
    }
  }

  /**
   * Reject authentication request
   */
  async rejectAuthRequest(session_id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await this.client.post('/api/auth/reject', {
        session_id
      });

      return response.data;
    } catch (error: any) {
      console.error('Error rejecting auth request:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reject authentication'
      };
    }
  }
}

/**
 * Create or retrieve API client instance
 */
let apiClientInstance: CentralizedAuthApiClient | null = null;

export async function initializeApiClient(config: ApiClientConfig): Promise<CentralizedAuthApiClient> {
  apiClientInstance = new CentralizedAuthApiClient(config);
  return apiClientInstance;
}

export function getApiClient(): CentralizedAuthApiClient {
  if (!apiClientInstance) {
    throw new Error('API client not initialized. Call initializeApiClient first.');
  }
  return apiClientInstance;
}

export async function loadApiClientFromStorage(): Promise<CentralizedAuthApiClient | null> {
  try {
    const configStr = await AsyncStorage.getItem('@api_client_config');
    if (!configStr) {
      return null;
    }

    const config = JSON.parse(configStr);
    return await initializeApiClient(config);
  } catch (error) {
    console.error('Error loading API client config:', error);
    return null;
  }
}

export async function saveApiClientConfig(config: ApiClientConfig): Promise<void> {
  try {
    await AsyncStorage.setItem('@api_client_config', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving API client config:', error);
    throw error;
  }
}

export async function clearApiClientConfig(): Promise<void> {
  try {
    await AsyncStorage.removeItem('@api_client_config');
    apiClientInstance = null;
  } catch (error) {
    console.error('Error clearing API client config:', error);
    throw error;
  }
}
