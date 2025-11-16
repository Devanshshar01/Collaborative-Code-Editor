# 🔧 WebRTC Troubleshooting Guide

This guide helps you debug and fix common WebRTC issues in the collaborative editor's video calling feature.

## 🚨 Common Issues Overview

### 1. ICE Connection Failures Behind NAT

**Symptoms:**

- Peers show "checking" or "failed" connection state indefinitely
- Video calls never establish despite signaling working
- Debug logs show "No ICE candidates gathered"

### 2. Video Element Not Displaying Remote Stream

**Symptoms:**

- Black video tiles for remote participants
- Audio works but video is missing
- Console errors about video playback

### 3. Audio Echo Problems

**Symptoms:**

- Users hear their own voice echoing back
- Audio feedback loops
- Distorted or amplified audio

### 4. Peer Connection Not Establishing

**Symptoms:**

- Connection timeouts
- Repeated connection retry attempts
- Signaling works but no media flows

---

## 🛠️ Debug Mode Usage

Enable debug mode in the VideoCall component:

```jsx
<VideoCall
  roomId={roomId}
  userId={userId}
  userName={userName}
  enableDebugMode={true} // Enable detailed logging
  onError={handleError}
/>
```

### Reading Debug Console Output

Look for these log prefixes:

- `[WebRTC-userId][timestamp] 🚀` - Component initialization
- `[WebRTC-userId][timestamp] 🧊` - ICE connection events
- `[WebRTC-userId][timestamp] 📹` - Video stream events
- `[WebRTC-userId][timestamp] 🎤` - Audio events
- `[WebRTC-userId][timestamp] ❌` - Errors

### Debug Panel Features

The on-screen debug panel shows:

- Number of active peer connections
- Current ICE connection states
- Connection error count
- Export button for detailed reports

---

## 🧊 Issue 1: ICE Connection Failures Behind NAT

### Root Cause

Users behind symmetric NAT or restrictive firewalls cannot establish direct peer connections using STUN servers alone.

### Quick Diagnosis

```javascript
// Check ICE connection states in console
console.log('ICE States:', iceConnectionStates);

// Look for these warning signs:
// - "No ICE candidates gathered"
// - ICE state stuck on "checking"
// - "Connection timeout for peer"
```

### Solutions

#### Option A: Configure TURN Server (Recommended)

1. **Get TURN server credentials** from providers like:
    - [Twilio Network Traversal Service](https://www.twilio.com/stun-turn)
    - [Xirsys](https://xirsys.com/) (has free tier)
    - Self-hosted [coturn server](https://github.com/coturn/coturn)

2. **Add to `.env` file:**

```bash
TURN_SERVER_URL=turn:your-server.com:3478,turns:your-server.com:5349
TURN_SERVER_USERNAME=your-username  
TURN_SERVER_CREDENTIAL=your-password
```

3. **Restart the server** - TURN will be used automatically as fallback

#### Option B: Test ICE Server Connectivity

```javascript
import { WebRTCUtils } from '../config/webrtc';

// Test current ICE servers
WebRTCUtils.testIceServers().then(results => {
  results.forEach(result => {
    console.log(`${result.url}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
  });
});
```

#### Option C: Force TURN Usage (Testing)

Temporarily modify the peer creation to use TURN-only:

```javascript
const config = {
  iceServers: TURN_ONLY_CONFIG.iceServers,
  iceTransportPolicy: 'relay' // Force TURN relay
};
```

### Prevention

- Always configure TURN servers for production
- Test from different network conditions
- Monitor ICE candidate types in logs

---

## 📹 Issue 2: Video Element Not Displaying Remote Stream

### Root Cause

Multiple factors can prevent video rendering: autoplay policies, incorrect stream binding, track issues.

### Quick Diagnosis

```javascript
// Check if stream has video tracks
peer.stream.getVideoTracks().forEach(track => {
  console.log('Video track:', {
    id: track.id,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState
  });
});

// Check video element state
const videoEl = document.querySelector(`video[data-peer-id="${peerId}"]`);
console.log('Video element:', {
  srcObject: !!videoEl.srcObject,
  readyState: videoEl.readyState,
  videoWidth: videoEl.videoWidth,
  videoHeight: videoEl.videoHeight
});
```

### Solutions

#### Fix 1: Ensure Proper Stream Binding

```jsx
<video
  data-peer-id={peer.peerId}
  autoPlay
  playsInline  // Required for iOS
  ref={video => {
    if (video && peer.stream) {
      video.srcObject = peer.stream;
      
      // Handle autoplay failures
      video.play().catch(err => {
        console.log('Autoplay failed:', err);
        // User gesture required - show play button
      });
    }
  }}
/>
```

#### Fix 2: Handle Autoplay Restrictions

```javascript
// Add user interaction handler
const handleVideoClick = (videoElement) => {
  videoElement.play().catch(console.error);
};

// In render
<video 
  onClick={(e) => handleVideoClick(e.target)}
  autoPlay
  playsInline
  muted // Muted videos can autoplay
/>
```

#### Fix 3: Check Stream Health

The WebRTCDebugger automatically runs health checks. Look for these issues:

- "Video dimensions are 0x0" - Stream not rendering
- "Video track has ended" - Track stopped unexpectedly
- "Video element has no data" - Stream not bound properly

#### Fix 4: Monitor Video Element Events

```javascript
videoElement.addEventListener('loadeddata', () => {
  console.log('✅ Video data loaded');
});

videoElement.addEventListener('error', (e) => {
  console.error('❌ Video error:', e);
});
```

---

## 🎤 Issue 3: Audio Echo Problems

### Root Cause

Local audio is being played through speakers and picked up by microphone, creating feedback loops.

### Quick Diagnosis

```javascript
// Check if local video elements are muted
const unmutedLocalVideos = document.querySelectorAll('video:not([muted])');
if (unmutedLocalVideos.length > 0) {
  console.error('❌ Found unmuted local videos - this causes echo!');
}

// Check audio constraints
localStream.getAudioTracks().forEach(track => {
  const settings = track.getSettings();
  console.log('Audio settings:', {
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl
  });
});
```

### Solutions

#### Fix 1: Ensure Local Video is Muted

```jsx
// Local video MUST be muted
<video
  ref={localVideoRef}
  autoPlay
  playsInline
  muted  // Critical - prevents echo
/>
```

#### Fix 2: Verify Audio Constraints

```javascript
const mediaConstraints = {
  audio: {
    echoCancellation: true,    // Enable echo cancellation
    noiseSuppression: true,    // Reduce background noise
    autoGainControl: true,     // Automatic volume adjustment
    sampleRate: 48000         // High quality audio
  },
  video: { /* video config */ }
};
```

#### Fix 3: Use Headphones for Testing

- Always test video calls with headphones/earbuds
- Speakers + microphone = guaranteed echo
- Educate users about this requirement

#### Fix 4: Monitor Audio Levels

The WebRTCDebugger includes automatic audio level monitoring:

```javascript
// Enable audio monitoring
debugger.debugAudioEcho(localStream, remoteStreams);

// Look for warnings:
// - "audio appears to be silent" - microphone issues
// - "audio levels very high" - possible feedback
```

---

## 🤝 Issue 4: Peer Connection Not Establishing

### Root Cause

Complex signaling issues, network problems, or configuration errors prevent the WebRTC handshake from completing.

### Quick Diagnosis

```javascript
// Check signaling flow in console logs
// 1. Should see: "📡 Sending offer to [peerId]"
// 2. Should see: "📥 Received ANSWER from [peerId]" 
// 3. Should see: "🧊 ICE candidates exchanged"
// 4. Should see: "✅ Peer connected: [peerId]"

// Check peer connection state
console.log('Peer states:', Object.keys(peersRef.current));
console.log('ICE states:', iceConnectionStates);
```

### Solutions

#### Fix 1: Verify Socket.IO Connection

```javascript
// Check if Socket.IO is connected
socket.on('connect', () => {
  console.log('✅ Socket.IO connected');
});

socket.on('disconnect', () => {
  console.log('❌ Socket.IO disconnected'); 
});
```

#### Fix 2: Check Room Joining

```javascript
// Verify users are in same room
socket.on('room-joined', (room) => {
  console.log('Joined room with users:', room.users);
});

socket.on('user-joined', (users) => {
  console.log('Room users updated:', users);
});
```

#### Fix 3: Enable Connection Retry Logic

The enhanced VideoCall component automatically:

- Retries failed connections up to 3 times
- Falls back to TURN-only connections
- Times out stuck connections after 30 seconds

#### Fix 4: Check for Mixed Content Issues

HTTPS pages cannot access HTTP WebSocket servers:

```javascript
// In production, ensure URLs match protocol
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socketUrl = `${wsProtocol}//${window.location.host}`;
```

---

## 📊 Debug Report Export

### Generating Reports

Click "Export Debug Report" in the debug panel to download a comprehensive JSON report containing:

- Connection states for all peers
- ICE candidate information
- Stream health data
- Error history
- Timing information

### Sharing Reports

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "roomId": "room-123",
  "userId": "user-456", 
  "sessionDuration": 45000,
  "connections": {
    "peer-789": {
      "state": "connected",
      "candidates": 6,
      "candidateTypes": {
        "host": 2,
        "srflx": 3, 
        "relay": 1
      },
      "failureCount": 0
    }
  },
  "streams": {
    "peer-789": {
      "videoTracks": 1,
      "audioTracks": 1, 
      "hasElement": true
    }
  }
}
```

---

## ⚡ Quick Fixes Checklist

When video calls aren't working, try these in order:

### 🔍 Basic Checks

- [ ] Browser supports WebRTC (Chrome/Firefox/Safari/Edge)
- [ ] Camera/microphone permissions granted
- [ ] HTTPS used (required for production)
- [ ] No browser extensions blocking media
- [ ] Socket.IO server running and accessible

### 🌐 Network Checks

- [ ] Can access server from browser
- [ ] WebSocket connection succeeds
- [ ] Not behind restrictive corporate firewall
- [ ] TURN server configured for production

### 💻 Code Checks

- [ ] Local video element has `muted` attribute
- [ ] Remote videos have `autoPlay` and `playsInline`
- [ ] Error handlers properly implemented
- [ ] Debug mode enabled during testing

### 🔧 Advanced Debugging

- [ ] ICE candidates being generated
- [ ] Signaling messages flowing correctly
- [ ] Media tracks enabled and not muted
- [ ] Connection states progressing normally

---

## 📞 Getting Help

### Console Logs to Share

When reporting issues, include these console logs:

```bash
# Filter for WebRTC logs
[WebRTC-*] 
[VideoCall]
SimplePeer errors
MediaStream errors
```

### Environment Information

```javascript
// Include this info when reporting bugs
console.log('Browser:', navigator.userAgent);
console.log('WebRTC Support:', !!(navigator.mediaDevices && RTCPeerConnection));
console.log('Current URL:', window.location.href);
console.log('Protocol:', window.location.protocol);
```

### Test URLs for Debugging

- **WebRTC Test**: https://test.webrtc.org/
- **Network Test**: https://networktest.twilio.com/
- **STUN/TURN Test**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

---

## 🏆 Best Practices

### Development

- Always test with debug mode enabled
- Test across different browsers and networks
- Use headphones to avoid audio feedback
- Monitor browser developer console

### Production

- Configure TURN servers before going live
- Use HTTPS for all WebRTC functionality
- Implement proper error handling and user feedback
- Monitor connection success rates

### User Education

- Provide clear camera/microphone permission instructions
- Recommend using headphones for calls
- Include browser compatibility information
- Offer network troubleshooting tips

---

**Need more help?** Check the main README.md or open an issue with your debug report attached.