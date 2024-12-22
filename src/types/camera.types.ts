import { CameraError, CameraErrorCode } from "./error.types";

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

export type CameraCapturedResult = {
    width: number;
    height: number;
    uri: string;
    base64?: string;
};

export type CameraCaptureOptions = {
    quality?: number;
    scale?: number;
    imageType?: ImageType;
    mirror?: boolean;
    isImageMirror?: boolean;
};

export interface Resolution {
    width: number;
    height: number;
    // aspectRatio: number;
    // name: string;
    // preset?: ResolutionPreset;
}

// Configuration interfaces
export interface CameraConfiguration {
    // DOM Elements
    previewElement?: HTMLVideoElement | null;
    captureElement?: HTMLCanvasElement | null;

    // Device Settings
    isAudioEnabled?: boolean;
    selectedDevice?: MediaDeviceInfo | null;
    cameraType?: CameraType;

    // Resolution Settings
    targetResolution?: Resolution;
    fallbackResolution?: Resolution;

    // Display Settings
    isMirrored?: boolean;
    isAutoRotate?: boolean;

    // Advanced Settings
    // initialConstraints?: MediaTrackConstraints;
    // captureFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
    // captureQuality?: number; // 0-1

    // Performance Settings
    // powerEfficient?: boolean;
    // lowLatency?: boolean;
}

// Camera capabilities and constraints
export interface CameraCapabilities {
    zoom: {
        min: number;
        max: number;
        step: number;
    };
    focus: {
        modes: string[];
        distance: {
            min: number;
            max: number;
        };
    };
    brightness: {
        min: number;
        max: number;
        step: number;
    };
    iso: {
        min: number;
        max: number;
        step: number;
    };
    whiteBalance: {
        modes: string[];
        temperature: {
            min: number;
            max: number;
        };
    };
}

export interface CameraSettings {
    autoFocus?: string;
    flashMode?: string;
    whiteBalance?: string;
    brightness?: number;
    focusDistance?: number;
    zoom?: number;
};

// State interface
export interface CameraState {
    // Device Information
    devices: MediaDeviceInfo[];
    activeDevice?: MediaDeviceInfo;
    activeResolution?: Resolution;
    userPreferredDevice?: MediaDeviceInfo;

    // Stream State
    stream?: MediaStream | null;
    isStreaming: boolean;

    // Camera Settings
    capabilities?: CameraCapabilities;
    currentSettings?: CameraSettings;
    // defaultConstraints: CameraConstraints;

    // Utils
    hasMultipleDevices: boolean;
    configuration: CameraConfiguration;

    // Error State
    error?: CameraError<CameraErrorCode>

    // Recording State
    isRecording: boolean;
    recordedChunks: Blob[];
    recordingDuration?: number;
    recordingFormat?: string;

    // Photo Capture State
    lastCapturedImage?: CameraCapturedResult

    // Performance Metrics
    // frameRate?: number;
    // latency?: number;
    // batteryImpact?: number;

    // UI State
    isMirrored: boolean;
    // isFullscreen: boolean;
    // brightness: number;
    // contrast: number;

    // Features State
    supportsTorch: boolean;
    supportsFocus: boolean;
    supportsZoom: boolean;
    supportsRecording: boolean;
}


