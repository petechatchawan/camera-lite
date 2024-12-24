import { EventDetail } from "../main/event-manager";
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

export type ImageType = 'image/png' | 'image/jpeg';

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
    name?: string;
    // aspectRatio: number;
    // name: string;
    // preset?: ResolutionPreset;
}

export interface MaxResolution {
    deviceId: string;
    label: string;
    maxWidth: number;
    maxHeight: number;
}

export interface ResolutionSupport extends Resolution {
    isSupported: boolean;
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

// Main Camera State Interface
export interface CameraState {
    // Device Information
    devices: MediaDeviceInfo[];
    activeDevice?: MediaDeviceInfo;
    activeResolution?: Resolution;
    hasMultipleDevices: boolean;
    selectedDevice?: MediaDeviceInfo | null;
    cameraType?: CameraType;

    // Stream and Activity State
    stream?: MediaStream | null;
    isActive: boolean;
    isInitializing: boolean;

    // Settings and Capabilities
    capabilities?: CameraCapabilities;
    currentSettings?: CameraSettings;
    isAudioEnabled: boolean;
    targetResolution?: Resolution;
    fallbackResolution?: Resolution;
    isAutoRotate: boolean;

    // Elements
    previewElement: HTMLVideoElement | null;
    captureElement: HTMLCanvasElement | null;

    // Features Support
    supportsTorch: boolean;
    supportsFocus: boolean;
    supportsZoom: boolean;
    supportsRecording: boolean;

    // UI State
    isMirrored: boolean;

    // Results
    lastCapturedImage?: CameraCapturedResult;

    // Error Handling
    error?: CameraError<CameraErrorCode>;

    // Callbacks
    onStateChange?: (state: CameraState) => void;
    onError?: (error: EventDetail) => void;
    onStarted?: () => void
    onStopped?: () => void;
}


