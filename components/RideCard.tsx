
import React, { useState, useEffect } from 'react';
import { Ride, RideType, User } from '../types';

interface RideCardProps {
  ride: Ride;
  onContact: (ride: Ride) => void;
  onBook: (ride: Ride) => void;
  onViewProfile: (user: User) => void;
  onCancel: (ride: Ride) => void;
  onComplete?: (ride: Ride, pin: string) => void;
  isHost?: boolean;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onContact, onBook, onViewProfile, onCancel, onComplete, isHost = false }) => {
  const isOffer = ride.type === RideType.OFFER; 
  const isBooked = ride.status === 'BOOKED';
  const isCancelled = ride.status === 'CANCELLED';
  const isCompleted = ride.status === 'COMPLETED';
  const isMyActiveRide = ride.isBookedByCurrentUser;
  
  // ROLE LOGIC
  // Driver: The person driving. (Host of Offer OR Responder to Request)
  const isDriver = (ride.type === RideType.OFFER && isHost) || (ride.type === RideType.REQUEST && isMyActiveRide);
  
  // Passenger Role: The person riding. (Responder to Offer OR Host of Request)
  const isPassengerRole = (ride.type === RideType.OFFER && isMyActiveRide) || (ride.type === RideType.REQUEST && isHost);

  // Local state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [timeLockRemaining, setTimeLockRemaining] = useState(0);

  // Theme Configuration
  const theme = isOffer 
    ? { 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-100', 
        badge: 'bg-emerald-100 text-emerald-700',
        label: 'DRIVER OFFERING RIDE',
        buttonText: 'Join Ride',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
      }
    : { 
        color: 'text-violet-600', 
        bg: 'bg-violet-50', 
        border: 'border-violet-100',
        badge: 'bg-violet-100 text-violet-700',
        label: 'STUDENT NEEDS RIDE',
        buttonText: 'Give Ride',
        buttonClass: 'bg-violet-600 hover:bg-violet-700 text-white'
      };

  // Determine trust color
  const trustColor = ride.host.trustScore > 90 ? 'text-green-600' : ride.host.trustScore > 70 ? 'text-yellow-600' : 'text-red-600';
  const trafficColor = ride.trafficLevel === 'HEAVY' ? 'text-red-500' : ride.trafficLevel === 'MODERATE' ? 'text-orange-500' : 'text-green-500';

  // Status Badge Logic
  const getStatusBadge = () => {
    switch (ride.status) {
        case 'OPEN': return <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-1 border border-blue-100 text-[10px] font-bold">🟢 OPEN</span>;
        case 'BOOKED': return <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded flex items-center gap-1 border border-amber-100 text-[10px] font-bold">📅 BOOKED</span>;
        case 'COMPLETED': return <span className="bg-green-50 text-green-600 px-2 py-1 rounded flex items-center gap-1 border border-green-100 text-[10px] font-bold">✅ COMPLETED</span>;
        case 'CANCELLED': return <span className="bg-red-50 text-red-600 px-2 py-1 rounded flex items-center gap-1 border border-red-100 text-[10px] font-bold">❌ CANCELLED</span>;
        default: return null;
    }
  };

  // Anti-Cheat Time Lock Effect
  useEffect(() => {
    if (isDriver && ride.bookedAt && !isCompleted && !isCancelled) {
        const interval = setInterval(() => {
            // 5 seconds lock for testing
            const LOCK_DURATION = 5000; 
            const elapsed = Date.now() - (ride.bookedAt || 0);
            const remaining = Math.max(0, LOCK_DURATION - elapsed);
            setTimeLockRemaining(Math.ceil(remaining / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [isDriver, ride.bookedAt, isCompleted, isCancelled]);

  // Google Maps Link
  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = `${ride.from.lat},${ride.from.lng}`;
    const destination = `${ride.to.lat},${ride.to.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (showCancelConfirm) {
        onCancel(ride);
        setShowCancelConfirm(false);
    } else {
        setShowCancelConfirm(true);
        setTimeout(() => setShowCancelConfirm(false), 3000);
    }
  };

  const handleSubmitPin = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onComplete) onComplete(ride, pinInput);
      setPinInput('');
      setIsCompleting(false);
  };

  // Can Complete if: I am Driver + Has Passenger (someone booked) + Not Cancelled/Completed
  const hasPassenger = !!ride.passenger;
  const canComplete = isDriver && hasPassenger && !isCancelled && !isCompleted;
  const isTimeLocked = timeLockRemaining > 0;

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all mb-4 relative overflow-hidden group animate-fade-in ${isBooked && !isMyActiveRide && !isHost ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      
      {/* Active Ride Highlight */}
      {isMyActiveRide && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-500"></div>
      )}

      {/* HEADER */}
      <div className={`flex items-center justify-between mb-4 pb-3 border-b border-dashed ${theme.border}`}>
        <div className="flex items-center">
            {isOffer ? (
                 <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    <span className="text-[10px] font-black tracking-wider">DRIVER</span>
                 </div>
            ) : (
                <div className="flex items-center gap-2 text-violet-700 bg-violet-50 px-2 py-1 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                    <span className="text-[10px] font-black tracking-wider">PASSENGER</span>
                 </div>
            )}
        </div>
        <div className="flex items-center gap-2">
            {getStatusBadge()}
            <span className="text-xs text-slate-400 font-medium">
                {ride.time}
            </span>
        </div>
      </div>

      {/* USER INFO */}
      <div className="flex items-start gap-4 mb-4">
        <div 
          className="relative cursor-pointer transition-transform active:scale-95"
          onClick={(e) => { e.stopPropagation(); onViewProfile(ride.host); }}
        >
          <img 
            src={ride.host.avatarUrl} 
            alt={ride.host.name} 
            className={`w-12 h-12 rounded-full object-cover border-2 ${isOffer ? 'border-emerald-100' : 'border-violet-100'}`}
          />
          {ride.host.isVerifiedStudent && (
            <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-white">
              ✓
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 
            className="font-bold text-slate-800 text-base leading-none cursor-pointer hover:text-brand-600"
            onClick={(e) => { e.stopPropagation(); onViewProfile(ride.host); }}
          >
            {ride.host.name}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wide flex items-center gap-1">
            🎓 {ride.host.university || 'University Student'}
          </p>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onViewProfile(ride.host); }}
            className="text-[10px] text-brand-600 font-bold hover:underline mt-1 flex items-center gap-1 bg-brand-50 px-2 py-0.5 rounded-full w-fit"
          >
            View Profile 
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="flex items-center text-[10px] mt-2 gap-2">
            <span className={`font-bold ${trustColor}`}>{ride.host.trustScore}% Trust</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">{ride.host.ridesCompleted} rides</span>
          </div>
        </div>
        <div className="text-right">
             <div className="text-xl font-bold text-slate-900">${ride.price}</div>
             <div className="text-[10px] text-slate-400">per seat</div>
        </div>
      </div>

      {/* ROUTE INFO */}
      <div className="bg-slate-50 rounded-xl p-3 space-y-3 border border-slate-100 relative">
         <button 
            onClick={handleOpenMaps}
            className="absolute top-2 right-2 p-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-all shadow-sm z-10 active:scale-95"
            title="Open Route in Google Maps"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>
        </button>

        <div className="flex items-stretch gap-3">
          <div className="flex flex-col items-center gap-1 pt-1.5 pb-1">
            <div className={`w-2.5 h-2.5 rounded-full border-2 ${isOffer ? 'bg-white border-emerald-500' : 'bg-white border-violet-500'}`}></div>
            <div className={`w-0.5 flex-1 border-l-2 ${isOffer ? 'border-emerald-200' : 'border-dashed border-violet-300'} min-h-[30px]`}></div>
            <div className={`w-2.5 h-2.5 rounded-full ${isOffer ? 'bg-emerald-500' : 'bg-violet-500'}`}></div>
          </div>
          <div className="flex-1 space-y-3 py-0.5">
            <div>
               <div className="flex justify-between items-baseline pr-8">
                  <p className="text-[10px] text-slate-400 font-bold">FROM</p>
                   {ride.distanceFromUser !== undefined && (
                    <span className="text-[10px] font-bold text-slate-400">
                        {ride.distanceFromUser.toFixed(1)} mi away
                    </span>
                  )}
               </div>
               <p className="font-bold text-slate-800 text-sm truncate">{ride.from.name}</p>
            </div>
            
            <div>
               <div className="flex justify-between items-baseline pr-8">
                   <p className="text-[10px] text-slate-400 font-bold">TO</p>
                   <div className={`text-[10px] font-bold flex items-center gap-1 ${trafficColor}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {ride.tripDuration}
                   </div>
               </div>
               <p className="font-bold text-slate-800 text-sm truncate">{ride.to.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
        <span className={`px-2 py-1 rounded flex items-center gap-1 ${ride.seats > 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
           💺 {ride.seats > 0 ? `${ride.seats} seats available` : 'Full'}
        </span>
        
        {/* ROLE BASED PIN DISPLAY */}
        
        {/* SCENARIO: I am the Passenger (Riding). I see the Code. */}
        {isPassengerRole && ride.verificationCode && (
             <div className="w-full mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800">
                    <span className="text-xl">🔑</span>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-amber-600">Your Boarding PIN</p>
                        <p className="text-lg font-black tracking-widest">{ride.verificationCode}</p>
                    </div>
                </div>
                <div className="text-[9px] text-amber-600 text-right max-w-[120px] leading-tight">
                    Show this code to the driver at drop-off.
                </div>
             </div>
        )}

        {/* SCENARIO: I am the Driver (Driving). I see the Verify UI. */}
        {isDriver && ride.passenger && !isCompleted && !isCancelled && (
             <div className="w-full mt-2 p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-xl">🔒</span>
                    <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Verification Required</p>
                        <p className="text-xs font-bold">Ask passenger for 4-digit PIN</p>
                    </div>
                </div>
             </div>
        )}
      </div>

      {/* PIN ENTRY UI (For Driver Completion) */}
      {isCompleting ? (
          <div className="mt-4 bg-slate-900 p-4 rounded-xl animate-fade-in">
              <p className="text-white text-xs font-bold mb-2 text-center">Ask passenger for PIN:</p>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0000"
                    className="flex-1 bg-slate-800 text-white text-center font-mono text-lg tracking-widest rounded-lg border border-slate-700 focus:border-brand-500 outline-none py-2"
                    autoFocus
                  />
                  <button 
                    onClick={handleSubmitPin}
                    disabled={pinInput.length !== 4}
                    className="px-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Verify
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsCompleting(false); }}
                    className="px-3 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
              </div>
          </div>
      ) : (
      /* STANDARD BUTTONS */
      <div className="mt-4 flex gap-3">
        {isCancelled ? (
            <button disabled className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl border border-slate-200 cursor-not-allowed">
                Ride Cancelled
            </button>
        ) : isCompleted ? (
            <button disabled className="w-full py-3 bg-green-50 text-green-600 font-bold rounded-xl border border-green-100 cursor-not-allowed flex items-center justify-center gap-2">
                ✅ Ride Completed
            </button>
        ) : isMyActiveRide || isHost ? (
             <>
                {/* Open Chat Button - For Everyone Involved */}
                <button 
                    onClick={(e) => { e.stopPropagation(); isHost ? onContact(ride) : onBook(ride); }} 
                    className="flex-[2] py-3 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 bg-brand-600 text-white hover:bg-brand-700"
                >
                    Open Chat
                </button>

                {/* Driver Controls - Complete Ride */}
                {isDriver && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsCompleting(true); }}
                        disabled={!canComplete || isTimeLocked}
                        className={`flex-[2] py-3 text-sm font-bold rounded-xl transition-colors shadow-sm active:scale-95 flex flex-col items-center leading-none justify-center gap-0.5 ${(!canComplete || isTimeLocked) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                        <span>Complete</span>
                         {isTimeLocked ? (
                                <span className="text-[9px] font-normal opacity-75">Wait {timeLockRemaining}s</span>
                            ) : null}
                    </button>
                )}
                
                {/* Cancel Button - For Everyone Involved */}
                <button 
                    onClick={handleCancelClick}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors shadow-sm active:scale-95 ${showCancelConfirm ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-100 hover:bg-red-50'}`}
                >
                    {showCancelConfirm ? 'Confirm?' : 'Cancel'}
                </button>
             </>
        ) : (
            <div className="flex gap-3 w-full">
                <button 
                onClick={(e) => { e.stopPropagation(); onContact(ride); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors text-slate-600 bg-white border border-slate-200 hover:bg-slate-50`}
                >
                Chat
                </button>
            
                <button 
                onClick={(e) => { e.stopPropagation(); onBook(ride); }}
                disabled={isBooked}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 ${
                    isBooked
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : theme.buttonClass
                }`}
                >
                {isBooked ? 'Closed' : theme.buttonText}
                </button>
            </div>
        )}
      </div>
      )}
    </div>
  );
};
