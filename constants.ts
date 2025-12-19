
import { User, Ride, RideType, ChatSummary } from './types';

// COORDS DICTIONARY - Expanded for better coverage
export const DFW_LOCATIONS: Record<string, { lat: number, lng: number, defaultAddress: string }> = {
  'denton': { lat: 33.2148, lng: -97.1331, defaultAddress: '1155 Union Cir, Denton, TX 76203' },
  'unt': { lat: 33.2075, lng: -97.1526, defaultAddress: '1155 Union Cir, Denton, TX 76203' },
  'irving': { lat: 32.8140, lng: -96.9489, defaultAddress: '3333 N MacArthur Blvd, Irving, TX 75062' },
  'arlington': { lat: 32.7357, lng: -97.1081, defaultAddress: '701 S Nedderman Dr, Arlington, TX 76019' },
  'uta': { lat: 32.7292, lng: -97.1152, defaultAddress: '701 S Nedderman Dr, Arlington, TX 76019' },
  'dallas': { lat: 32.7767, lng: -96.7970, defaultAddress: '1 Main St, Dallas, TX 75202' },
  'fort worth': { lat: 32.7555, lng: -97.3308, defaultAddress: '200 W Belknap St, Fort Worth, TX 76102' },
  'plano': { lat: 33.0198, lng: -96.6989, defaultAddress: '5908 Headquarters Dr, Plano, TX 75024' },
  'richardson': { lat: 32.9483, lng: -96.7299, defaultAddress: '800 W Campbell Rd, Richardson, TX 75080' },
  'utd': { lat: 32.9856, lng: -96.7502, defaultAddress: '800 W Campbell Rd, Richardson, TX 75080' },
  'frisco': { lat: 33.1507, lng: -96.8236, defaultAddress: '9100 Dallas Pkwy, Frisco, TX 75034' },
  'euless': { lat: 32.8370, lng: -97.0819, defaultAddress: '201 N Ector Dr, Euless, TX 76039' },
  'bedford': { lat: 32.8440, lng: -97.1431, defaultAddress: '2000 Forest Ridge Dr, Bedford, TX 76021' },
  'grapevine': { lat: 32.9342, lng: -97.0781, defaultAddress: '3000 Grapevine Mills Pkwy, Grapevine, TX 76051' },
  'carrollton': { lat: 32.9756, lng: -96.8900, defaultAddress: '1945 E Jackson Rd, Carrollton, TX 75006' },
  'lewisville': { lat: 33.0462, lng: -96.9942, defaultAddress: '2501 S Valley Pkwy, Lewisville, TX 75067' },
  'coppell': { lat: 32.9546, lng: -97.0150, defaultAddress: '255 Parkway Blvd, Coppell, TX 75019' },
  'flower mound': { lat: 33.0146, lng: -97.0970, defaultAddress: '2121 Cross Timbers Rd, Flower Mound, TX 75028' },
  'mckinney': { lat: 33.1972, lng: -96.6398, defaultAddress: '111 N Tennessee St, McKinney, TX 75069' },
  'allen': { lat: 33.1032, lng: -96.6706, defaultAddress: '300 Watters Rd, Allen, TX 75013' },
};

export const CURRENT_USER: User = {
  id: 'u_me',
  name: 'Alex Smith',
  avatarUrl: 'https://picsum.photos/200/200?random=1',
  university: 'UT Arlington',
  bio: 'CS Major. I drive a Honda Civic. Love coffee and podcasts!',
  trustScore: 92,
  ridesCompleted: 14,
  cancellations: 0,
  isVerifiedStudent: true,
  location: { 
    name: 'UTA Library',
    address: '702 Planetarium Pl, Arlington, TX 76019',
    lat: 32.7292, 
    lng: -97.1152 
  },
};

export const MOCK_USERS: User[] = [
  {
    id: 'u_1',
    name: 'Sarah Jenkins',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    university: 'UNT Denton',
    bio: 'Psychology student. Always on time!',
    trustScore: 98,
    ridesCompleted: 45,
    cancellations: 1,
    isVerifiedStudent: true,
    location: { 
        name: 'UNT Union',
        address: '1155 Union Cir, Denton, TX 76203',
        lat: 33.2075, 
        lng: -97.1526 
    },
  },
  {
    id: 'u_2',
    name: 'Mike Chen',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    university: 'UT Dallas',
    bio: 'Commuting from Richardson. Music lover.',
    trustScore: 45, 
    ridesCompleted: 5,
    cancellations: 3,
    isVerifiedStudent: true,
    location: { 
        name: 'UTD Campus', 
        address: '800 W Campbell Rd, Richardson, TX 75080',
        lat: 32.9856, 
        lng: -96.7502 
    },
  },
  {
    id: 'u_3',
    name: 'Emily Ross',
    avatarUrl: 'https://picsum.photos/200/200?random=4',
    university: 'SMU',
    bio: 'Just looking for safe rides to campus.',
    trustScore: 88,
    ridesCompleted: 22,
    cancellations: 2,
    isVerifiedStudent: true,
    location: { 
        name: 'SMU Hall',
        address: '6425 Boaz Ln, Dallas, TX 75205',
        lat: 32.8412, 
        lng: -96.7845 
    },
  }
];

export const MOCK_RIDES: Ride[] = [
  {
    id: 'r_1',
    host: MOCK_USERS[0],
    type: RideType.OFFER,
    from: { 
        name: 'Denton (Artemisa Ln)', 
        address: '2545 Artemisa Lane, Denton, TX',
        lat: 33.2540, 
        lng: -97.1526 
    },
    to: { 
        name: 'Irving (Meadowcreek)', 
        address: '1223 Meadow Creek Dr, Irving, TX',
        lat: 32.8540, 
        lng: -96.9700 
    },
    time: '2:30 PM',
    price: 12,
    seats: 3,
    status: 'OPEN',
    description: 'Heading back after class. Smooth jazz listener.',
    tripDistance: 0, 
    tripDuration: 'Loading...',
    trafficLevel: 'LOW'
  },
  {
    id: 'r_2',
    host: MOCK_USERS[1],
    type: RideType.REQUEST,
    from: { 
        name: 'Arlington (UTA)', 
        address: '701 S Nedderman Dr, Arlington, TX',
        lat: 32.7292, 
        lng: -97.1150 
    },
    to: { 
        name: 'Dallas (Deep Ellum)', 
        address: '2625 Main St, Dallas, TX',
        lat: 32.7825, 
        lng: -96.7890 
    },
    time: '5:00 PM',
    price: 18,
    seats: 1,
    status: 'OPEN',
    description: 'Need to catch a concert.',
    tripDistance: 0,
    tripDuration: 'Loading...',
    trafficLevel: 'HEAVY'
  },
  {
    id: 'r_3',
    host: MOCK_USERS[2],
    type: RideType.OFFER,
    from: { 
        name: 'Richardson (UTD)', 
        address: '800 W Campbell Rd, Richardson, TX',
        lat: 32.9856, 
        lng: -96.7502 
    },
    to: { 
        name: 'Plano (Legacy West)', 
        address: '5908 Headquarters Dr, Plano, TX',
        lat: 33.0798, 
        lng: -96.8250 
    },
    time: '10:00 AM',
    price: 8,
    seats: 2,
    status: 'OPEN',
    description: 'Short hop.',
    tripDistance: 0,
    tripDuration: 'Loading...',
    trafficLevel: 'LOW'
  }
];

export const MOCK_RIDE_HISTORY: Ride[] = [
  {
    id: 'h_1',
    host: CURRENT_USER,
    type: RideType.OFFER,
    from: { name: 'Arlington', address: 'UTA Campus', lat: 0, lng: 0 },
    to: { name: 'Dallas', address: 'Downtown Dallas', lat: 0, lng: 0 },
    time: '9:00 AM',
    date: 'Oct 24',
    price: 15,
    seats: 3,
    status: 'COMPLETED',
    tripDistance: 20.5,
    tripDuration: '30 min',
    trafficLevel: 'MODERATE'
  },
  {
    id: 'h_2',
    host: CURRENT_USER,
    type: RideType.REQUEST,
    from: { name: 'Dallas', address: 'Uptown', lat: 0, lng: 0 },
    to: { name: 'Arlington', address: 'Home', lat: 0, lng: 0 },
    time: '11:30 PM',
    date: 'Oct 22',
    price: 20,
    seats: 1,
    status: 'COMPLETED',
    tripDistance: 22.1,
    tripDuration: '25 min',
    trafficLevel: 'LOW'
  },
  {
    id: 'h_3',
    host: MOCK_USERS[0], // Sarah
    type: RideType.OFFER,
    from: { name: 'Denton', address: 'UNT', lat: 0, lng: 0 },
    to: { name: 'Frisco', address: 'Stonebriar', lat: 0, lng: 0 },
    time: '4:00 PM',
    date: 'Oct 20',
    price: 10,
    seats: 2,
    status: 'COMPLETED',
    tripDistance: 18.2,
    tripDuration: '28 min',
    trafficLevel: 'HEAVY'
  },
  {
    id: 'h_4',
    host: MOCK_USERS[0], // Sarah
    type: RideType.OFFER,
    from: { name: 'Frisco', address: 'IKEA', lat: 0, lng: 0 },
    to: { name: 'Denton', address: 'UNT', lat: 0, lng: 0 },
    time: '7:00 PM',
    date: 'Oct 20',
    price: 10,
    seats: 2,
    status: 'CANCELLED',
    tripDistance: 18.2,
    tripDuration: '25 min',
    trafficLevel: 'LOW'
  }
];

export const MOCK_CHAT_HISTORY: ChatSummary[] = [
    {
        id: 'c_1',
        otherUser: MOCK_USERS[0], // Sarah
        lastMessage: "Great! See you at the Union Circle stop.",
        timestamp: "2h ago",
        unread: true
    },
    {
        id: 'c_2',
        otherUser: MOCK_USERS[1], // Mike
        lastMessage: "Thanks for the ride man, really appreciate it.",
        timestamp: "1d ago",
        unread: false
    },
    {
        id: 'c_3',
        otherUser: MOCK_USERS[2], // Emily
        lastMessage: "Are you still going to Dallas tomorrow?",
        timestamp: "3d ago",
        unread: false
    }
];

export const SYSTEM_INSTRUCTION = `
You are an AI assistant for a student ridesharing app called "UniRide".
Your job is to:
1. Parse natural language ride requests into structured JSON.
2. Help students communicate politely and safely.
`;
