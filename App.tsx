
import React, { useState, useEffect, useRef } from 'react';
import { Ride, ViewState, ChatMessage, RideType, User, Location } from './types';
import { MOCK_RIDES, CURRENT_USER, DFW_LOCATIONS } from './constants';
import { RideCard } from './components/RideCard';
import { RadarMap } from './components/RadarMap';
import { TrustBadge } from './components/TrustBadge';
import { UserProfile } from './components/UserProfile';
import { parseRideRequest, getChatSuggestion } from './services/geminiService';

// Icons
const PlusIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const SendIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ChevronUpIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const ListIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const SearchIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

// UTILITIES
const calculateHaversine = (l1: Location, l2: Location) => {
  const R = 3958.8; 
  const dLat = (l2.lat - l1.lat) * (Math.PI / 180);
  const dLon = (l2.lng - l1.lng) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(l1.lat * (Math.PI / 180)) * Math.cos(l2.lat * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateApproxDrivingDistance = (l1: Location, l2: Location) => {
    return calculateHaversine(l1, l2) * 1.4;
};

// OSRM FETCH SERVICE
const fetchRealRouteData = async (from: Location, to: Location) => {
    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceMiles = route.distance * 0.000621371;
            const durationMins = Math.round(route.duration / 60);
            const geometry = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);

            const trafficFactor = 1 + (Math.random() * 0.3); 
            const realDuration = Math.round(durationMins * trafficFactor);

            let trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY' = 'LOW';
            if (trafficFactor > 1.25) trafficLevel = 'HEAVY';
            else if (trafficFactor > 1.1) trafficLevel = 'MODERATE';

            return {
                tripDistance: distanceMiles,
                tripDuration: `${realDuration} min`,
                trafficLevel,
                routeGeometry: geometry
            };
        }
    } catch (e) {
        console.warn("OSRM Fetch failed", e);
    }
    
    const dist = calculateApproxDrivingDistance(from, to);
    const duration = Math.round(dist * 2); 
    return {
        tripDistance: dist,
        tripDuration: `~${duration} min`,
        trafficLevel: 'LOW' as 'LOW',
        routeGeometry: null
    };
};

const getLocationData = (name: string, fallbackUserLoc: Location): Location => {
  const key = name.toLowerCase().trim();
  for (const city in DFW_LOCATIONS) {
    if (key.includes(city) || city.includes(key)) {
      const data = DFW_LOCATIONS[city];
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        address: data.defaultAddress,
        lat: data.lat,
        lng: data.lng
      };
    }
  }
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  return {
    name: name,
    address: `Near ${name}, TX`,
    lat: fallbackUserLoc.lat + latOffset,
    lng: fallbackUserLoc.lng + lngOffset
  };
};

const STORAGE_KEYS = {
  RIDES: 'uniride_rides',
  USER: 'uniride_user',
  CHATS: 'uniride_chats'
};

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  
  // Safe Local Storage Loading to prevent White Screen on corrupt data
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.USER);
        return saved ? JSON.parse(saved) : CURRENT_USER;
    } catch (e) {
        return CURRENT_USER;
    }
  });
  
  const [rides, setRides] = useState<Ride[]>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.RIDES);
        return saved ? JSON.parse(saved) : MOCK_RIDES;
    } catch (e) {
        return MOCK_RIDES;
    }
  });

  const [allChats, setAllChats] = useState<Record<string, ChatMessage[]>>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
  });

  const [ridesLoaded, setRidesLoaded] = useState(false);

  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  const [createType, setCreateType] = useState<RideType>(RideType.REQUEST);
  const [createFrom, setCreateFrom] = useState('');
  const [createTo, setCreateTo] = useState('');
  const [createTime, setCreateTime] = useState('');
  const [suggestions, setSuggestions] = useState<{key: string, name: string, address: string}[]>([]);
  const [activeField, setActiveField] = useState<'FROM' | 'TO' | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [activeChatRide, setActiveChatRide] = useState<Ride | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [cancelConfirmRideId, setCancelConfirmRideId] = useState<string | null>(null);
  // NEW: Track pending booking for 2-step verification
  const [pendingBookingRide, setPendingBookingRide] = useState<Ride | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'MY_RIDES' | RideType>('ALL');
  
  // New state for PIN entry in Chat view
  const [isChatCompleting, setIsChatCompleting] = useState(false);
  const [chatPinInput, setChatPinInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RIDES, JSON.stringify(rides));
  }, [rides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
  }, [allChats]);

  useEffect(() => {
    const hydrateRides = async () => {
        let hasUpdates = false;
        const updatedRides = await Promise.all(rides.map(async (ride) => {
            if (ride.routeGeometry) return ride;
            hasUpdates = true;
            const realData = await fetchRealRouteData(ride.from, ride.to);
            return { 
                ...ride, 
                ...realData,
                distanceFromUser: calculateHaversine(currentUser.location, ride.from)
            };
        }));
        if (hasUpdates) setRides(updatedRides);
        setRidesLoaded(true);
    };
    if (!ridesLoaded) hydrateRides();
  }, [ridesLoaded, currentUser.location]);

  const getCurrentChatKey = () => {
      if (activeChatRide) return `ride_${activeChatRide.id}`;
      if (activeChatUser) return `dm_${activeChatUser.id}`;
      return null;
  };
  const activeMessages = getCurrentChatKey() ? (allChats[getCurrentChatKey()!] || []) : [];

  useEffect(() => {
    if ((activeChatRide || activeChatUser) && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages, activeChatRide, activeChatUser]);

  useEffect(() => {
      if (!activeField) {
          setSuggestions([]);
          return;
      }
      const input = activeField === 'FROM' ? createFrom : createTo;
      if (input.length < 2) {
          setSuggestions([]);
          return;
      }
      const matches = Object.keys(DFW_LOCATIONS)
        .filter(key => key.includes(input.toLowerCase()) || DFW_LOCATIONS[key].defaultAddress.toLowerCase().includes(input.toLowerCase()))
        .map(key => {
            const loc = DFW_LOCATIONS[key];
            const name = key.charAt(0).toUpperCase() + key.slice(1);
            return { key, name, address: loc.defaultAddress };
        })
        .slice(5);
      setSuggestions(matches);
  }, [createFrom, createTo, activeField]);

  const handleSuggestionClick = (suggestion: {name: string, address: string}) => {
      if (activeField === 'FROM') setCreateFrom(suggestion.name);
      else setCreateTo(suggestion.name);
      setActiveField(null);
      setSuggestions([]);
  };

  const handleCreateRide = async () => {
    if (!createFrom || !createTo || !createTime) {
        alert("Please fill in all fields");
        return;
    }
    setIsCreating(true);
    const fromLoc = getLocationData(createFrom, currentUser.location);
    const toLoc = getLocationData(createTo, currentUser.location);
    const routeData = await fetchRealRouteData(fromLoc, toLoc);
    const pricePerMile = 0.8;
    const estimatedPrice = Math.max(5, Math.round(routeData.tripDistance * pricePerMile));

    const newRide: Ride = {
      id: `r_${Date.now()}`,
      host: currentUser,
      type: createType,
      from: fromLoc,
      to: toLoc,
      time: createTime,
      price: estimatedPrice,
      seats: createType === RideType.OFFER ? 3 : 1,
      status: 'OPEN',
      description: createType === RideType.OFFER ? 'I have space in my car.' : 'Need a ride to this location.',
      distanceFromUser: calculateHaversine(currentUser.location, fromLoc),
      tripDistance: routeData.tripDistance,
      tripDuration: routeData.tripDuration,
      trafficLevel: routeData.trafficLevel,
      routeGeometry: routeData.routeGeometry
    };
    setRides([newRide, ...rides]);
    setCreateFrom(''); setCreateTo(''); setCreateTime('');
    setIsCreating(false);
    setFilterType('MY_RIDES'); 
  };

  const handleContact = async (ride: Ride) => {
    if (ride.host.id === currentUser.id) {
        alert("Manage your ride details here (Mock)");
        return;
    }
    setSelectedRide(null); 
    setActiveChatRide(ride);
    setActiveChatUser(ride.host);
    setView(ViewState.CHAT);
    setIsPanelOpen(false);
    setCancelConfirmRideId(null);
    setPendingBookingRide(null);
    
    const greeting = ride.type === RideType.OFFER 
      ? `Hi ${ride.host.name.split(' ')[0]}, is your ride to ${ride.to.name} still available?` 
      : `Hi ${ride.host.name.split(' ')[0]}, I can help with your ride request to ${ride.to.name}.`;
    setChatInput(greeting);
    setSuggestedReplies([]);
  };

  const handleChatWithUser = (user: User) => {
      setActiveChatUser(user);
      setActiveChatRide(null);
      setView(ViewState.CHAT); 
      setViewingUser(null);
      setCancelConfirmRideId(null);
      setPendingBookingRide(null);
  };

  const handleSendMessage = (text: string) => {
    const chatKey = getCurrentChatKey();
    if (!chatKey) return;
    const newMessage: ChatMessage = {
      id: `m_${Date.now()}`,
      senderId: currentUser.id,
      text: text,
      timestamp: Date.now()
    };
    setAllChats(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), newMessage]
    }));
    setChatInput('');
    setSuggestedReplies([]); 
  };

  // STEP 1: Initiate Booking (Request Phase)
  const handleBookRide = (ride: Ride) => {
    if (ride.host.id === currentUser.id) return;
    
    setSelectedRide(null);
    setActiveChatRide(ride);
    setActiveChatUser(ride.host);
    setView(ViewState.CHAT);
    setIsPanelOpen(false);
    setCancelConfirmRideId(null);

    // If already booked, don't re-initiate
    if (ride.isBookedByCurrentUser) return;

    // Set pending state to show "Confirm" button
    setPendingBookingRide(ride);

    const chatKey = `ride_${ride.id}`;
    
    const intentMessage = ride.type === RideType.OFFER 
        ? `Hi ${ride.host.name.split(' ')[0]}! I'd like to book a seat on your ride to ${ride.to.name}.`
        : `Hi ${ride.host.name.split(' ')[0]}! I can give you a ride to ${ride.to.name} for $${ride.price}.`;

    const initialMsg: ChatMessage = {
        id: `m_init_${Date.now()}`,
        senderId: currentUser.id,
        text: intentMessage,
        timestamp: Date.now()
    };

    setAllChats(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), initialMsg]
    }));

    // Bot Reply (Negotiation Phase)
    setTimeout(() => {
        const responseText = ride.type === RideType.OFFER
            ? `Hey! Yes, I have a seat open. Please confirm the booking if you want to proceed.`
            : `That works for me! Please confirm if you are sure you want to drive me.`;

        const responseMsg: ChatMessage = {
            id: `m_res_${Date.now()}`,
            senderId: ride.host.id,
            text: responseText,
            timestamp: Date.now()
        };
        
        setAllChats(prev => ({
            ...prev,
            [chatKey]: [...(prev[chatKey] || []), responseMsg]
        }));
    }, 1000);
  };

  // STEP 2: Finalize Booking (Action Phase)
  const handleFinalizeBooking = () => {
      if (!pendingBookingRide) return;
      
      const ride = pendingBookingRide;
      const chatKey = `ride_${ride.id}`;
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      // Update State
      setRides(prevRides => prevRides.map(r => {
        if (r.id === ride.id) {
            const isOffer = r.type === RideType.OFFER;
            let newSeats = r.seats;
            if (isOffer) newSeats = r.seats - 1;
            return { 
                ...r, 
                seats: newSeats, 
                status: (isOffer && newSeats <= 0) ? 'BOOKED' : (isOffer ? 'OPEN' : 'BOOKED'),
                isBookedByCurrentUser: true,
                verificationCode: pin,
                passenger: currentUser, // Track the passenger
                bookedAt: Date.now() // Track booking time
            };
        }
        return r;
    }));

    // Send Confirmation Messages
    const userConfirmMsg: ChatMessage = {
        id: `m_conf_${Date.now()}`,
        senderId: currentUser.id,
        text: "I've confirmed the booking!",
        timestamp: Date.now()
    };
    
    const pinMsg: ChatMessage = {
        id: `sys_pin_${Date.now()}`,
        senderId: 'system',
        text: `CONFIRMED. Passenger: Check your Ride Card for your PIN. Driver will verify at drop-off.`,
        timestamp: Date.now() + 100,
        isSystem: true
    };

    setAllChats(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), userConfirmMsg, pinMsg]
    }));

    setPendingBookingRide(null);
  };

  const handleCancel = (ride: Ride) => {
    if (!ride) return;
    setSelectedRide(null);
    
    const isHost = ride.host.id === currentUser.id;
    
    setCurrentUser(prev => ({
        ...prev,
        trustScore: Math.max(0, prev.trustScore - 5),
        cancellations: prev.cancellations + 1
    }));

    setRides(prevRides => prevRides.map(r => {
        if (r.id === ride.id) {
            if (r.host.id === currentUser.id) {
                return { ...r, status: 'CANCELLED' };
            }
            if (r.isBookedByCurrentUser) {
                const isOffer = r.type === RideType.OFFER;
                return { 
                    ...r, 
                    isBookedByCurrentUser: false,
                    seats: isOffer ? r.seats + 1 : r.seats, 
                    status: 'OPEN',
                    verificationCode: undefined,
                    passenger: undefined,
                    bookedAt: undefined
                };
            }
        }
        return r;
    }));

    const chatKey = `ride_${ride.id}`;
    const sysMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        senderId: 'system',
        text: isHost ? "🚫 Ride Cancelled by Host (-5 Trust Score)" : "🚫 Booking Cancelled by User (-5 Trust Score)",
        timestamp: Date.now(),
        isSystem: true
    };

    setAllChats(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), sysMsg]
    }));
    setCancelConfirmRideId(null);
    setPendingBookingRide(null);
  };

  const handleComplete = (ride: Ride, pin: string) => {
      // Verify logic runs on client for demo, but simulates server check
      
      // Verify PIN
      if (pin !== ride.verificationCode) {
          alert("❌ Incorrect PIN. Please ask the passenger for the correct 4-digit code.");
          return;
      }

      // ANTI-COLLUSION / FREQUENCY CAP
      let collusionDetected = false;
      if (ride.passenger) {
          const recentInteraction = rides.find(r => 
              r.status === 'COMPLETED' && 
              r.passenger?.id === ride.passenger?.id && 
              r.id !== ride.id
          );
          
          if (recentInteraction) {
              collusionDetected = true;
          }
      }

      const pointsAwarded = collusionDetected ? 0 : 1;

      const updatedUser = {
          ...currentUser,
          trustScore: Math.min(100, currentUser.trustScore + pointsAwarded),
          ridesCompleted: currentUser.ridesCompleted + 1
      };
      
      setCurrentUser(updatedUser);

      setRides(prevRides => prevRides.map(r => {
          if (r.id === ride.id) {
              return { 
                  ...r, 
                  status: 'COMPLETED',
                  host: updatedUser
              }; 
          }
          return r;
      }));

      const chatKey = `ride_${ride.id}`;
      const sysMsg: ChatMessage = {
        id: `sys_comp_${Date.now()}`,
        senderId: 'system',
        text: collusionDetected 
            ? `🏁 Ride Verified. (No points awarded: Frequency limit reached).`
            : `🏁 Ride Verified! +${pointsAwarded} Trust Score.`,
        timestamp: Date.now(),
        isSystem: true
      };

      setAllChats(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), sysMsg]
      }));
      
      if (collusionDetected) {
          alert(`✅ Verification Successful! (No points: Frequency limit reached).`);
      } else {
          alert(`✅ Verification Successful! Ride Completed.`);
      }
      setIsChatCompleting(false);
  };

  const handleViewProfile = (user: User) => {
      setViewingUser(user);
      setView(ViewState.PROFILE);
  };

  const handleUpdateProfile = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      setViewingUser(updatedUser);
  };
  
  const handleRideSelect = (ride: Ride) => {
      setSelectedRide(ride);
      setIsPanelOpen(false);
  };

  const renderHome = () => {
    const visibleRides = rides.filter(r => {
        if (filterType === 'MY_RIDES') {
            return r.host.id === currentUser.id || r.isBookedByCurrentUser;
        }
        return (r.status === 'OPEN' || r.status === 'BOOKED') && 
               (filterType === 'ALL' || r.type === filterType);
    });
    const mapRides = visibleRides;

    return (
      <div className="relative h-full w-full overflow-hidden">
        <RadarMap 
          className="fixed inset-0 w-full h-full"
          rides={mapRides} 
          userLocation={currentUser.location}
          onRideClick={handleRideSelect}
          selectedRideId={selectedRide?.id} 
        />

        <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start bg-gradient-to-b from-white/90 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">UniRide <span className="text-brand-500">.</span></h1>
            <p className="text-xs text-slate-600 font-medium bg-white/50 backdrop-blur rounded-full px-2 py-0.5 inline-block">Student Carpool Network</p>
          </div>
          <div onClick={() => handleViewProfile(currentUser)} className="cursor-pointer hover:scale-105 transition-transform pointer-events-auto shadow-lg rounded-2xl">
              <TrustBadge score={currentUser.trustScore} cancellations={currentUser.cancellations} />
          </div>
        </div>

        <div 
          className={`absolute left-0 right-0 bottom-0 z-40 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-[2.5rem] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col max-h-[85vh] ${isPanelOpen ? 'translate-y-0' : 'translate-y-[calc(100%-110px)]'}`}
        >
          <div 
            className="w-full p-3 flex flex-col items-center cursor-pointer bg-white rounded-t-[2.5rem] hover:bg-slate-50 transition-colors shrink-0 z-10 relative border-b border-slate-100"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3"></div>
            {!isPanelOpen && (
              <div className="flex justify-between items-center w-full px-6 pb-4 animate-fade-in">
                  <div>
                      <span className="font-bold text-lg text-slate-800">
                          {filterType === 'MY_RIDES' ? 'My Upcoming Rides' : 'Find a Ride'}
                      </span>
                      <p className="text-xs text-slate-500">{mapRides.length} active rides nearby</p>
                  </div>
                  <div className="bg-brand-600 text-white p-3 rounded-full shadow-lg shadow-brand-500/30">
                      <ListIcon />
                  </div>
              </div>
            )}
          </div>

          <div className={`overflow-y-auto px-4 pb-24 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 relative z-20">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                    Plan a Trip
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${createType === RideType.OFFER ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                        {createType === RideType.OFFER ? 'You are driving' : 'You need a ride'}
                    </span>
                </h3>

                <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                    <button 
                        onClick={() => setCreateType(RideType.REQUEST)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${createType === RideType.REQUEST ? 'bg-white shadow-sm text-violet-700' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Need Ride
                    </button>
                    <button 
                         onClick={() => setCreateType(RideType.OFFER)}
                         className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${createType === RideType.OFFER ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Offer Ride
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute left-3.5 top-8 bottom-8 w-0.5 bg-slate-200 z-0"></div>

                    <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className={`w-2.5 h-2.5 ml-2 rounded-full border-2 bg-white shrink-0 ${createType === RideType.OFFER ? 'border-emerald-500' : 'border-violet-500'}`}></div>
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                value={createFrom}
                                onFocus={() => setActiveField('FROM')}
                                onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                onChange={(e) => setCreateFrom(e.target.value)}
                                placeholder="Pickup Location (e.g. Denton)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
                            />
                            {activeField === 'FROM' && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                    {suggestions.map(s => (
                                        <div key={s.key} onClick={() => handleSuggestionClick(s)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                                            <div className="font-bold text-sm text-slate-800">{s.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{s.address}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4 relative z-10">
                         <div className={`w-2.5 h-2.5 ml-2 rounded-full shrink-0 ${createType === RideType.OFFER ? 'bg-emerald-500' : 'bg-violet-500'}`}></div>
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                value={createTo}
                                onFocus={() => setActiveField('TO')}
                                onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                onChange={(e) => setCreateTo(e.target.value)}
                                placeholder="Dropoff Location (e.g. Irving)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
                            />
                            {activeField === 'TO' && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                    {suggestions.map(s => (
                                        <div key={s.key} onClick={() => handleSuggestionClick(s)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                                            <div className="font-bold text-sm text-slate-800">{s.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{s.address}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={createTime}
                        onChange={(e) => setCreateTime(e.target.value)}
                        placeholder="Time (e.g. 2pm)"
                        className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <button 
                        onClick={handleCreateRide}
                        disabled={isCreating}
                        className="flex-1 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                    >
                        {isCreating ? 'Creating...' : (
                            <>
                             <PlusIcon />
                             {createType === RideType.OFFER ? 'Post Ride Offer' : 'Request Ride'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {['ALL', RideType.OFFER, RideType.REQUEST, 'MY_RIDES'].map((type) => (
                  <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                      filterType === type 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-105' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  >
                  {type === 'ALL' ? 'All Rides' : type === RideType.OFFER ? 'Driver Offers' : type === RideType.REQUEST ? 'Rider Requests' : 'My Rides (Active)'}
                  </button>
              ))}
            </div>

            <div className="space-y-4 min-h-[300px]">
              <h2 className="font-bold text-lg text-slate-800 px-1 sticky top-0 bg-white py-2 z-10">
                {filterType === 'MY_RIDES' ? 'Your Scheduled Trips' : 'Nearby Activity'}
              </h2>
              {visibleRides.map(ride => (
                  <RideCard 
                  key={ride.id} 
                  ride={ride} 
                  onContact={handleContact}
                  onBook={handleBookRide}
                  onViewProfile={handleViewProfile}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  isHost={ride.host.id === currentUser.id}
                  />
              ))}
              {visibleRides.length === 0 && (
                  <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="mb-2 text-2xl">🏜️</p>
                      <p className="font-medium">No rides found.</p>
                  </div>
              )}
            </div>
          </div>
        </div>

        {selectedRide && (
          <div className="absolute bottom-0 left-0 right-0 z-[60] p-4 animate-slide-up">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-w-md mx-auto">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur">
                      <h3 className="font-bold text-slate-800">Selected Route</h3>
                      <button onClick={() => setSelectedRide(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <CloseIcon />
                      </button>
                  </div>
                  <div className="p-2 bg-slate-50">
                          <RideCard 
                          ride={selectedRide} 
                          onContact={handleContact}
                          onBook={handleBookRide}
                          onViewProfile={handleViewProfile}
                          onCancel={handleCancel}
                          onComplete={handleComplete}
                          isHost={selectedRide.host.id === currentUser.id}
                          />
                  </div>
              </div>
          </div>
        )}
        
        {!isPanelOpen && !selectedRide && (
            <button 
              onClick={() => setIsPanelOpen(true)}
              className="absolute bottom-8 right-6 z-40 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
            >
              <ChevronUpIcon />
            </button>
        )}
      </div>
    );
  };

  const renderChat = () => {
    if (!activeChatUser) return null;
    
    let contextRide = activeChatRide;
    if (!contextRide) {
        contextRide = rides.find(r => r.host.id === activeChatUser.id && r.isBookedByCurrentUser) || null;
    }
    const currentRideState = contextRide ? rides.find(r => r.id === contextRide.id) : null;
    const chatKey = currentRideState ? `ride_${currentRideState.id}` : `dm_${activeChatUser.id}`;
    const messages = allChats[chatKey] || [];
    const isRideActive = currentRideState && currentRideState.status !== 'CANCELLED' && (currentRideState.isBookedByCurrentUser || currentRideState.host.id === currentUser.id);
    const isPendingBooking = pendingBookingRide && pendingBookingRide.id === activeChatRide?.id;

    // ROLE LOGIC FOR CHAT HEADER
    const isHost = currentRideState && currentRideState.host.id === currentUser.id;
    // Driver: The person driving. (Host of Offer OR Responder to Request)
    const isDriver = currentRideState && (
        (currentRideState.type === RideType.OFFER && isHost) || 
        (currentRideState.type === RideType.REQUEST && currentRideState.isBookedByCurrentUser)
    );

    // Can Complete if: I am Driver + Has Passenger (someone booked) + Not Cancelled/Completed
    const hasPassenger = !!currentRideState?.passenger;
    const canComplete = isDriver && hasPassenger && currentRideState?.status !== 'COMPLETED' && currentRideState?.status !== 'CANCELLED';

    return (
      <div className="flex flex-col h-screen bg-white animate-fade-in fixed inset-0 z-[100]">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 bg-white/90 backdrop-blur z-20 shadow-sm">
          <button onClick={() => setView(ViewState.HOME)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <img 
            src={activeChatUser.avatarUrl} 
            className="w-10 h-10 rounded-full cursor-pointer border border-slate-200" 
            alt="Host" 
            onClick={() => handleViewProfile(activeChatUser)}
          />
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 leading-tight">{activeChatUser.name}</h3>
            {currentRideState ? (
                <div className="flex flex-col">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span>{currentRideState.from.name}</span>
                        <span className="text-slate-300">➔</span>
                        <span>{currentRideState.to.name}</span>
                    </p>
                    {currentRideState.status === 'CANCELLED' && (
                         <span className="text-[9px] text-red-500 font-bold uppercase">Ride Cancelled</span>
                    )}
                </div>
            ) : (
                <p className="text-xs text-slate-400">Direct Message</p>
            )}
          </div>
          
          {/* NEW: DRIVER COMPLETE BUTTON IN CHAT HEADER */}
          {canComplete && (
              <button 
                onClick={() => setIsChatCompleting(!isChatCompleting)}
                className="text-[10px] font-bold bg-green-600 text-white px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30 active:scale-95"
              >
                  {isChatCompleting ? 'Close Verify' : 'Complete Ride'}
              </button>
          )}

          {isRideActive && !isHost && (
            <button 
                onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (cancelConfirmRideId === currentRideState!.id) handleCancel(currentRideState!);
                    else setCancelConfirmRideId(currentRideState!.id);
                }} 
                className={`text-[10px] font-bold border px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95 ${
                    cancelConfirmRideId === currentRideState!.id 
                    ? 'bg-red-600 text-white border-red-600 animate-pulse' 
                    : 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100'
                }`}
            >
                {cancelConfirmRideId === currentRideState!.id ? 'Confirm Cancel?' : 'Cancel Ride'}
            </button>
          )}
        </div>

        {/* PIN VERIFICATION UI FOR HOST IN CHAT */}
        {isChatCompleting && currentRideState && (
            <div className="bg-slate-900 p-4 animate-slide-up sticky top-[72px] z-20">
                <p className="text-white text-xs font-bold mb-2 text-center">Ask passenger for PIN to complete:</p>
                <div className="flex gap-2 max-w-xs mx-auto">
                    <input 
                        type="text" 
                        maxLength={4}
                        value={chatPinInput}
                        onChange={(e) => setChatPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0000"
                        className="flex-1 bg-slate-800 text-white text-center font-mono text-lg tracking-widest rounded-lg border border-slate-700 focus:border-brand-500 outline-none py-2"
                        autoFocus
                    />
                    <button 
                        onClick={() => handleComplete(currentRideState, chatPinInput)}
                        className="px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg"
                    >
                        Verify
                    </button>
                </div>
            </div>
        )}

        {/* CONFIRM BOOKING UI */}
        {isPendingBooking && (
            <div className="bg-brand-50 border-b border-brand-100 p-4 flex items-center justify-between sticky top-[72px] z-10 animate-slide-up">
                <div className="text-xs text-brand-800">
                    <span className="font-bold block">Confirm Booking?</span>
                    The driver has accepted. Secure your spot now.
                </div>
                <button 
                    onClick={handleFinalizeBooking}
                    className="bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg hover:bg-brand-700 active:scale-95 transition-all"
                >
                    Confirm & Book
                </button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map(msg => {
            if (msg.isSystem) {
                return (
                    <div key={msg.id} className="flex justify-center my-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                            {msg.text}
                        </span>
                    </div>
                );
            }
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {suggestedReplies.length > 0 && (
          <div className="p-3 flex gap-2 overflow-x-auto bg-white border-t border-slate-100 scrollbar-hide">
            {suggestedReplies.map((reply, idx) => (
              <button 
                key={idx}
                onClick={() => handleSendMessage(reply)}
                className="whitespace-nowrap px-4 py-2 bg-brand-50 text-brand-600 text-xs font-semibold rounded-xl border border-brand-100 hover:bg-brand-100 transition-colors"
              >
                ✨ {reply}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-100 pb-8">
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-100 border-0 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none text-slate-700 placeholder:text-slate-400"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
            />
            <button 
              onClick={() => handleSendMessage(chatInput)}
              disabled={!chatInput.trim()}
              className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30 transition-all active:scale-95"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-slate-100 font-sans text-slate-900 selection:bg-brand-200 overflow-hidden">
      {view === ViewState.HOME && renderHome()}
      {view === ViewState.CHAT && renderChat()}
      {view === ViewState.PROFILE && viewingUser && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-white">
             <UserProfile 
                user={viewingUser} 
                isCurrentUser={viewingUser.id === currentUser.id} 
                onBack={() => setView(ViewState.HOME)}
                onUpdate={handleUpdateProfile}
                onChat={handleChatWithUser}
            />
        </div>
      )}
    </div>
  );
}