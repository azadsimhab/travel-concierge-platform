// API Helper Functions for Travel Concierge Frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export interface ChatRequest {
  message: string;
  session_id: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  agent_used: string;
  confidence: number;
  suggestions: string[];
  booking_options: BookingOption[];
}

export interface BookingOption {
  type: string;
  option: string;
  price: string;
  details: string;
  availability: string;
}

export interface ImageSearchRequest {
  image_data: string;
  session_id: string;
  search_type: string;
}

export interface ImageSearchResponse {
  success: boolean;
  results: {
    identified_objects: string[];
    suggested_destinations: Array<{
      name: string;
      similarity: number;
      reason: string;
    }>;
    activities: string[];
    best_time_to_visit?: string;
  };
  session_id: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  type: string;
  rating: number;
  price_range: string;
  image?: string;
  highlights: string[];
}

// API Client Class
class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Chat with AI agents
  async chat(message: string, sessionId: string, context: Record<string, any> = {}): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId,
        context
      })
    });
  }

  // Image search functionality
  async imageSearch(
    imageData: string, 
    sessionId: string, 
    searchType: string = 'destination'
  ): Promise<ImageSearchResponse> {
    return this.request<ImageSearchResponse>('/api/image-search', {
      method: 'POST',
      body: JSON.stringify({
        image_data: imageData,
        session_id: sessionId,
        search_type: searchType
      })
    });
  }

  // Get popular destinations
  async getPopularDestinations(): Promise<{ destinations: Destination[] }> {
    return this.request<{ destinations: Destination[] }>('/api/destinations/popular');
  }

  // Create booking
  async createBooking(
    bookingData: Record<string, any>,
    sessionId: string,
    userId: string
  ): Promise<{ success: boolean; booking: any; message: string }> {
    return this.request('/api/booking', {
      method: 'POST',
      body: JSON.stringify({
        ...bookingData,
        session_id: sessionId,
        user_id: userId
      })
    });
  }

  // Get session information
  async getSessionInfo(sessionId: string): Promise<any> {
    return this.request(`/api/session/${sessionId}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; services: Record<string, any> }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Utility functions
export const utils = {
  // Convert file to base64
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  // Format timestamp
  formatTimestamp: (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  },

  // Generate session ID
  generateSessionId: (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Truncate text
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Format price
  formatPrice: (price: string | number, currency: string = 'USD'): string => {
    if (typeof price === 'string') return price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  },

  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
};

// WebSocket connection for real-time updates
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private sessionId: string;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.url = `${API_BASE_URL.replace('http', 'ws')}/ws/${sessionId}`;
  }

  connect(onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect(onMessage, onError);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private attemptReconnect(onMessage: (data: any) => void, onError?: (error: Event) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(onMessage, onError);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  sendMessage(message: string, context: Record<string, any> = {}): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const data = {
        message,
        context,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default apiClient; 