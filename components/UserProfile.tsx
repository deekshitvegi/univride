
import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_RIDE_HISTORY, MOCK_CHAT_HISTORY } from '../constants';

interface UserProfileProps {
  user: User;
  isCurrentUser: boolean;
  onBack: () => void;
  onUpdate?: (updatedUser: User) => void;
  onChat?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  isCurrentUser, 
  onBack, 
  onUpdate,
  onChat 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [isLocating, setIsLocating] = useState(false);

  // Filter ride history for this user
  const userHistory = MOCK_RIDE_HISTORY.filter(r => r.host.id === user.id);
  
  // Filter chat history (Only show for current user's private profile)
  const chatHistory = isCurrentUser ? MOCK_CHAT_HISTORY : [];

  const handleSave = () => {
    if (onUpdate) onUpdate(editedUser);
    setIsEditing(false);
  };

  const handleGPSUpdate = (saveImmediately: boolean) => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Simple reverse geocoding using OSM Nominatim
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        let name = "Current Location";
        
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if (data && data.display_name) {
                const addr = data.address;
                name = addr.building || addr.amenity || addr.road || addr.suburb || addr.city || "Current Location";
                address = data.display_name;
            }
        } catch (e) {
            console.warn("Reverse geocoding failed", e);
        }

        const newLocation = {
            lat: latitude,
            lng: longitude,
            name: name,
            address: address
        };

        if (saveImmediately) {
            if (onUpdate) onUpdate({ ...user, location: newLocation });
            setEditedUser(prev => ({ ...prev, location: newLocation })); // Sync edit state
        } else {
            setEditedUser(prev => ({ ...prev, location: newLocation }));
        }
        
        setIsLocating(false);
    }, (error) => {
        alert("Unable to retrieve location. Please check permissions.");
        setIsLocating(false);
    });
  };

  return (
    <div className="bg-white min-h-screen pb-20 animate-fade-in">
      {/* Header / Cover */}
      <div className="relative h-40 bg-gradient-to-r from-brand-500 to-accent-500">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur p-2 rounded-full text-white hover:bg-white/30 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        {isCurrentUser && (
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-sm font-bold hover:bg-white/30 transition-colors z-10"
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="px-6 relative">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <div className="relative group">
            <img 
              src={editedUser.avatarUrl} 
              alt={editedUser.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
            {user.isVerifiedStudent && (
              <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Verified Student">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer">
                 <span className="text-white text-xs font-bold">Change</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="pt-20 pb-6">
          {isEditing ? (
            <div className="space-y-4 mb-4">
                <div>
                    <label className="block text-xs text-slate-400 font-bold uppercase">Name</label>
                    <input 
                        type="text" 
                        value={editedUser.name}
                        onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                        className="w-full text-2xl font-bold text-slate-900 border-b border-slate-300 focus:border-brand-500 outline-none py-1"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 font-bold uppercase">University</label>
                    <input 
                        type="text" 
                        value={editedUser.university || ''}
                        onChange={e => setEditedUser({...editedUser, university: e.target.value})}
                        placeholder="University"
                        className="w-full text-slate-500 border-b border-slate-300 focus:border-brand-500 outline-none py-1"
                    />
                </div>
                
                {/* Location Edit */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-xs text-slate-400 font-bold uppercase mb-2 flex justify-between items-center">
                        Location
                        <button 
                            onClick={() => handleGPSUpdate(false)}
                            disabled={isLocating}
                            className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold hover:bg-blue-200 flex items-center gap-1 transition-colors"
                        >
                           {isLocating ? 'Locating...' : '📍 Use GPS'}
                        </button>
                    </label>
                    <input 
                        type="text" 
                        value={editedUser.location.name}
                        onChange={e => setEditedUser({...editedUser, location: {...editedUser.location, name: e.target.value}})}
                        placeholder="Location Name (e.g. Home)"
                        className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-slate-300 focus:border-brand-500 outline-none py-1 mb-2"
                    />
                    <textarea 
                        value={editedUser.location.address}
                        onChange={e => setEditedUser({...editedUser, location: {...editedUser.location, address: e.target.value}})}
                        placeholder="Full Address"
                        className="w-full text-xs text-slate-500 bg-transparent border-b border-slate-300 focus:border-brand-500 outline-none resize-none"
                        rows={2}
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Bio</label>
                    <textarea 
                        value={editedUser.bio || ''}
                        onChange={e => setEditedUser({...editedUser, bio: e.target.value})}
                        placeholder="Write a short bio..."
                        className="w-full text-sm text-slate-600 border rounded p-2 focus:border-brand-500 outline-none"
                        rows={3}
                    />
                </div>
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {user.name}
              </h1>
              <p className="text-slate-500 font-medium flex items-center gap-1">
                <span className="text-lg">🎓</span> {user.university}
              </p>
              
              {/* Location Display */}
              <div className="mt-3 flex items-start gap-2 text-slate-600">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div>
                      <p className="text-sm font-bold text-slate-800">{user.location.name}</p>
                      <p className="text-xs text-slate-400 leading-tight">{user.location.address}</p>
                  </div>
                  {isCurrentUser && (
                    <button 
                      onClick={() => handleGPSUpdate(true)}
                      disabled={isLocating}
                      className="ml-auto text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium"
                      title="Update to current location"
                    >
                      {isLocating ? (
                        <svg className="animate-spin h-3 w-3 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : '📍 Update'}
                    </button>
                  )}
              </div>

              <div className="mt-4 bg-slate-50 p-4 rounded-xl text-slate-600 text-sm leading-relaxed border border-slate-100">
                {user.bio || "No bio provided yet."}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className={`text-2xl font-bold ${user.trustScore > 90 ? 'text-green-500' : 'text-yellow-500'}`}>{user.trustScore}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trust Score</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="text-2xl font-bold text-slate-800">{user.ridesCompleted}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rides</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="text-2xl font-bold text-red-500">{user.cancellations}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cancels</div>
            </div>
          </div>

          {/* INBOX SECTION (Only for Current User) */}
          {isCurrentUser && (
            <div className="mb-8">
                <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    Recent Messages
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {chatHistory.filter(c => c.unread).length} new
                    </span>
                </h3>
                <div className="space-y-3">
                    {chatHistory.map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => onChat && onChat(chat.otherUser)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors active:scale-95 ${chat.unread ? 'bg-brand-50 border-brand-100' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                        >
                            <div className="relative">
                                <img src={chat.otherUser.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt={chat.otherUser.name} />
                                {chat.unread && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h4 className={`text-sm truncate ${chat.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                        {chat.otherUser.name}
                                    </h4>
                                    <span className="text-[10px] text-slate-400">{chat.timestamp}</span>
                                </div>
                                <p className={`text-xs truncate ${chat.unread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* RIDE HISTORY SECTION */}
          <div className="mb-8">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Ride History</h3>
            <div className="space-y-3">
                {userHistory.length > 0 ? (
                    userHistory.map(ride => (
                        <div key={ride.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${ride.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {ride.status === 'COMPLETED' ? '✓' : '✕'}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 text-sm flex items-center gap-1">
                                        {ride.from.name} 
                                        <span className="text-slate-400">→</span> 
                                        {ride.to.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {ride.date} • {ride.time}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-slate-900">${ride.price}</div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider ${ride.status === 'COMPLETED' ? 'text-green-500' : 'text-red-400'}`}>
                                    {ride.status}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-400 italic">
                        No ride history available.
                    </div>
                )}
            </div>
          </div>

          {/* Actions */}
          {!isCurrentUser && onChat && (
            <button 
                onClick={() => onChat(user)}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                Message {user.name.split(' ')[0]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
