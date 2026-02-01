import React from 'react';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Chat/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';
import './styles/index.css';

import ProfileSetup from './components/Profile/ProfileSetup';
import MediaPlayer from './components/Media/MediaPlayer';
import ParticipantsPanel from './components/Chat/ParticipantsPanel';

function App() {
  const [currentChannel, setCurrentChannel] = React.useState('general');
  const [userProfile, setUserProfile] = React.useState(() => {
    const stored = sessionStorage.getItem('chat_profile');
    return stored ? JSON.parse(stored) : null;
  });

  const handleProfileComplete = (profile) => {
    sessionStorage.setItem('chat_profile', JSON.stringify(profile));
    sessionStorage.setItem('chat_username', profile.username);
    setUserProfile(profile);
  };

  if (!userProfile) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  const handleStartDM = (username) => {
    const participants = [userProfile.username, username].sort();
    const dmRoom = `dm_${participants.join('_')}`;
    setCurrentChannel(dmRoom);
  };

  return (
    <SocketProvider>
      <div className="app-container">
        <Sidebar
          currentChannel={currentChannel}
          setCurrentChannel={setCurrentChannel}
          userProfile={userProfile}
        />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
          {!currentChannel.startsWith('dm_') && <MediaPlayer channel={currentChannel} />}
          <ChatWindow currentChannel={currentChannel} />
        </div>
        <ParticipantsPanel
          currentChannel={currentChannel}
          userProfile={userProfile}
          onStartDM={handleStartDM}
        />
      </div>
    </SocketProvider>
  );
}

export default App;
