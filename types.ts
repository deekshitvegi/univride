
export enum RideType {
  OFFER = 'OFFER',
  REQUEST = 'REQUEST'
}

export interface Location {
  name: string; // Short name e.g. "UNT Union"
  address: string; // Full address e.g. "1155 Union Cir, Denton, TX"
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  university?: string;
  bio?: string;
  trustScore: number; // 0 to 100
  ridesCompleted: number;
  cancellations: number;
  isVerifiedStudent: boolean;
  location: Location; // Current user location
}

export interface Ride {
  id: string;
  host: User;
  type: RideType;
  from: Location;
  to: Location;
  time: string;
  date?: string; // Date for history e.g. "Oct 12"
  price: number;
  seats: number;
  description?: string;
  status: 'OPEN' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';
  distanceFromUser?: number; // Distance from current user to pickup
  isBookedByCurrentUser?: boolean; // New: Tracks if current user joined this ride
  verificationCode?: string; // New: 4-digit PIN for anti-cheat completion
  passenger?: User; // New: The user who booked the ride (for tracking collusion)
  bookedAt?: number; // New: Timestamp when booked (for time locking)
  
  // New Fields
  tripDistance: number; // Real driving miles
  tripDuration: string; // Real driving time
  trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY'; 
  routeGeometry?: any; // Encoded polyline or coordinate array for the map
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ChatSummary {
  id: string;
  otherUser: User;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export enum ViewState {
  HOME = 'HOME',
  CREATE = 'CREATE',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE'
}
