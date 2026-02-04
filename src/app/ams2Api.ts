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

export interface ApiListInfo {
  path: string;
  description?: string;
}

export interface ApiListData {
  description: string;
  list: Record<string, unknown>[];
}

export interface ServerVersion {
  [key: string]: unknown; // We'll refine this once we see the response
}

export interface ServerStatus {
  [key: string]: unknown;
}

export interface SessionStatus {
  [key: string]: unknown;
}

export interface ApiHelp {
  [key: string]: unknown;
}

export interface LogEntry {
  [key: string]: unknown;
}

export interface AllListsResponse {
  [path: string]: {
    description: string;
    list: Record<string, unknown>[];
  };
}

class AMS2ApiService {
  private buildBaseUrl(connection: ServerConnection): string {
    return `http://${connection.ipAddress}:${connection.port}`;
  }

  private buildAuthHeader(connection: ServerConnection): string {
    const credentials = Buffer.from(`${connection.username}:${connection.password}`).toString(
      'base64',
    );
    return `Basic ${credentials}`;
  }

  private async request<T>(
    connection: ServerConnection,
    endpoint: string,
  ): Promise<ApiResponse<T[]>> {
    const url = `${this.buildBaseUrl(connection)}${endpoint}`;

    console.log(`[AMS2 API] Requesting: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.buildAuthHeader(connection),
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

      const envelope = (await response.json()) as AMS2ApiEnvelope<T>;
      console.log(
        `[AMS2 API] Response result: ${envelope.result}, items: ${envelope.response?.list?.length ?? 0}`,
      );

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

  private async requestWithDescription(
    connection: ServerConnection,
    endpoint: string,
  ): Promise<ApiResponse<ApiListData>> {
    const url = `${this.buildBaseUrl(connection)}${endpoint}`;

    console.log(`[AMS2 API] Requesting: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.buildAuthHeader(connection),
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

      const envelope = (await response.json()) as {
        result: string;
        response: { description: string; list: Record<string, unknown>[] };
      };

      console.log(
        `[AMS2 API] Response result: ${envelope.result}, items: ${envelope.response?.list?.length ?? 0}`,
      );

      if (envelope.result !== 'ok') {
        return { success: false, error: `API returned: ${envelope.result}` };
      }

      return {
        success: true,
        data: {
          description: envelope.response.description,
          list: envelope.response.list,
        },
      };
    } catch (error) {
      console.error(`[AMS2 API] Error:`, error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timed out after 15 seconds.' };
        }
        if (error.message.includes('ECONNREFUSED')) {
          return { success: false, error: 'Connection refused. Is the server running?' };
        }
        if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
          return { success: false, error: 'Could not reach server. Check IP address and port.' };
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

  async getListByPath(
    connection: ServerConnection,
    path: string,
  ): Promise<ApiResponse<ApiListData>> {
    return this.requestWithDescription(connection, `/api/list/${path}`);
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

  // Add a generic request method for non-list endpoints
  private async requestRaw<T>(
    connection: ServerConnection,
    endpoint: string,
  ): Promise<ApiResponse<T>> {
    const url = `${this.buildBaseUrl(connection)}${endpoint}`;

    console.log(`[AMS2 API] Requesting: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.buildAuthHeader(connection),
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

      const data = (await response.json()) as T;
      console.log(`[AMS2 API] Response:`, data);

      return { success: true, data };
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
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unknown error occurred' };
    }
  }

  async getVersion(connection: ServerConnection): Promise<ApiResponse<ServerVersion>> {
    return this.requestRaw<ServerVersion>(connection, '/api/version');
  }

  async getHelp(connection: ServerConnection): Promise<ApiResponse<ApiHelp>> {
    return this.requestRaw<ApiHelp>(connection, '/api/help');
  }

  async getStatus(connection: ServerConnection): Promise<ApiResponse<ServerStatus>> {
    return this.requestRaw<ServerStatus>(connection, '/status');
  }

  async getSessionStatus(connection: ServerConnection): Promise<ApiResponse<SessionStatus>> {
    return this.requestRaw<SessionStatus>(connection, '/api/session/status');
  }

  async getLog(connection: ServerConnection): Promise<ApiResponse<LogEntry[]>> {
    return this.requestRaw<LogEntry[]>(connection, '/api/log');
  }

  async getAllLists(connection: ServerConnection): Promise<ApiResponse<AllListsResponse>> {
    const url = `${this.buildBaseUrl(connection)}/api/list/all`;

    console.log(`[AMS2 API] Requesting all lists: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Longer timeout for big payload

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.buildAuthHeader(connection),
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Authentication failed.' };
        }
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const envelope = (await response.json()) as {
        result: string;
        response: AllListsResponse;
      };

      if (envelope.result !== 'ok') {
        return { success: false, error: `API returned: ${envelope.result}` };
      }

      console.log(`[AMS2 API] Received ${Object.keys(envelope.response).length} lists`);

      return { success: true, data: envelope.response };
    } catch (error) {
      console.error(`[AMS2 API] Error:`, error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timed out. The server may be slow or unreachable.',
          };
        }
        if (error.message.includes('ECONNREFUSED')) {
          return { success: false, error: 'Connection refused. Is the server running?' };
        }
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unknown error occurred' };
    }
  }
}

export const ams2Api = new AMS2ApiService();
