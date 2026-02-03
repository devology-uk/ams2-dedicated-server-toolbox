import type { ServerConnection } from './store.js';

// API Response wrapper
export interface AMS2ApiEnvelope<T> {
  result: string;
  response: {
    description: string;
    list: T[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Track {
  id: number;
  name: string;
  gridsize: number;
  default_day: number;
  default_month: number;
  default_year: number;
}

export interface Vehicle {
  id: number;
  name: string;
  class?: string;
}

export interface VehicleClass {
  value: number;
  name: string;
  translated_name: string;
}

export interface Flag {
  value: number;
  name: string;
}

class AMS2ApiService {
  private buildBaseUrl(connection: ServerConnection): string {
    return `http://${connection.ipAddress}:${connection.port}`;
  }

  private buildAuthHeader(connection: ServerConnection): string {
    const credentials = Buffer.from(
      `${connection.username}:${connection.password}`
    ).toString('base64');
    return `Basic ${credentials}`;
  }

  private async request<T>(
    connection: ServerConnection,
    endpoint: string
  ): Promise<ApiResponse<T[]>> {
    const url = `${this.buildBaseUrl(connection)}${endpoint}`;

    console.log(`[AMS2 API] Requesting: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.buildAuthHeader(connection),
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[AMS2 API] Response status: ${response.status}`);

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Authentication failed. Check username and password.' };
        }
        if (response.status === 404) {
          return { success: false, error: `Endpoint not found: ${endpoint}` };
        }
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const envelope = await response.json() as AMS2ApiEnvelope<T>;
      console.log(`[AMS2 API] Response result: ${envelope.result}, items: ${envelope.response?.list?.length ?? 0}`);

      if (envelope.result !== 'ok') {
        return { success: false, error: `API returned: ${envelope.result}` };
      }

      return { success: true, data: envelope.response.list };
    } catch (error) {
      console.error(`[AMS2 API] Error:`, error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timed out after 10 seconds.' };
        }
        if (error.message.includes('ECONNREFUSED')) {
          return { success: false, error: 'Connection refused. Is the server running?' };
        }
        if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
          return { success: false, error: 'Could not reach server. Check IP address and port.' };
        }
        if (error.message.includes('fetch')) {
          return { success: false, error: `Network error: ${error.message}` };
        }
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unknown error occurred' };
    }
  }

  async testConnection(connection: ServerConnection): Promise<ApiResponse<boolean>> {
    console.log(`[AMS2 API] Testing connection to ${connection.ipAddress}:${connection.port}`);
    const result = await this.request<Track>(connection, '/api/list/tracks');
    if (result.success) {
      return { success: true, data: true };
    }
    return { success: false, error: result.error };
  }

  async getTracks(connection: ServerConnection): Promise<ApiResponse<Track[]>> {
    return this.request<Track>(connection, '/api/list/tracks');
  }

  async getVehicles(connection: ServerConnection): Promise<ApiResponse<Vehicle[]>> {
    return this.request<Vehicle>(connection, '/api/list/vehicles');
  }

  async getVehicleClasses(connection: ServerConnection): Promise<ApiResponse<VehicleClass[]>> {
    return this.request<VehicleClass>(connection, '/api/list/vehicle_classes');
  }

  async getSessionFlags(connection: ServerConnection): Promise<ApiResponse<Flag[]>> {
    return this.request<Flag>(connection, '/api/list/flags/session');
  }

  async getPlayerFlags(connection: ServerConnection): Promise<ApiResponse<Flag[]>> {
    return this.request<Flag>(connection, '/api/list/flags/player');
  }
}

export const ams2Api = new AMS2ApiService();