export enum PermissionStatus {
    /**
     * User has granted the permission.
     */
    GRANTED = "granted",
    /**
     * User hasn't granted or denied the permission yet.
     */
    UNDETERMINED = "undetermined",
    /**
     * User has denied the permission.
     */
    DENIED = "denied"
}

export interface PermissionResponse {
    status: PermissionStatus;
    granted: boolean;
}

export type CameraType = 'front' | 'back';

export type ImageType = 'png' | 'jpg';

export type CameraCapturedPicture = {
    width: number;
    height: number;
    uri: string;
    base64?: string;
};

export type CameraPictureOptions = {
    quality?: number;
    scale?: number;
    imageType?: ImageType;
    mirror?: boolean;
    isImageMirror?: boolean;
};

export interface CameraState {
    // Device Information
    devices: MediaDeviceInfo[];
    activeDevice?: MediaDeviceInfo;
    userPreferredDevice?: MediaDeviceInfo;

    // Stream State
    stream?: MediaStream;
    isStreaming: boolean;

    // Camera Settings
    // capabilities: CameraCapabilities;
    // currentSettings: CameraSettings;
    // defaultConstraints: CameraConstraints;

    // Permission State
    hasPermission: boolean;
    permissionDenied: boolean;

    // utils
    hasMultipleDevices: boolean;

    // Error State
    error?: Error;

    // Recording State
    isRecording: boolean;
    recordedChunks: Blob[];

    // Photo Capture State
    lastCapturedImage?: Blob;

    // Performance Metrics
    frameRate?: number;
    latency?: number;

    // UI State
    isMirrored: boolean;
    isFullscreen: boolean;

    // Features State
    supportsTorch: boolean;
    supportsFocus: boolean;
    supportsZoom: boolean;
}