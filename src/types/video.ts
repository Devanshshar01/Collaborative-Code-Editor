export interface ParticipantMetadata {
    socketId: string;
    userId: string;
    userName: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
}

export interface SignalPayload {
    roomId: string;
    targetSocketId: string;
    signal: unknown;
    metadata?: ParticipantMetadata;
}

export interface SignalingEvents {
    OFFER: 'webrtc-offer';
    ANSWER: 'webrtc-answer';
    ICE_CANDIDATE: 'webrtc-ice-candidate';
    MUTE: 'webrtc-mute';
    UNMUTE: 'webrtc-unmute';
    VIDEO_OFF: 'webrtc-video-off';
    VIDEO_ON: 'webrtc-video-on';
    SCREEN_SHARE_ON: 'webrtc-screen-share-on';
    SCREEN_SHARE_OFF: 'webrtc-screen-share-off';
}

export const SIGNALING_EVENTS: SignalingEvents = {
    OFFER: 'webrtc-offer',
    ANSWER: 'webrtc-answer',
    ICE_CANDIDATE: 'webrtc-ice-candidate',
    MUTE: 'webrtc-mute',
    UNMUTE: 'webrtc-unmute',
    VIDEO_OFF: 'webrtc-video-off',
    VIDEO_ON: 'webrtc-video-on',
    SCREEN_SHARE_ON: 'webrtc-screen-share-on',
    SCREEN_SHARE_OFF: 'webrtc-screen-share-off'
};
