import { CameraError, CameraErrorCode, CameraEventDetail } from './error.types';

export enum PermissionStatus {
    /**
     * User has granted the permission.
     */
    GRANTED = 'granted',
    /**
     * User hasn't granted or denied the permission yet.
     */
    UNDETERMINED = 'undetermined',
    /**
     * User has denied the permission.
     */
    DENIED = 'denied',
}

export interface PermissionResponse {
    status: PermissionStatus;
    granted: boolean;
}

/**
 * Represents the orientation of the device.
 */
export interface Orientation {
    type: 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';
    angle: number; // Angle in degrees (0, 90, 180, 270)
}

/**
 * Represents the type of camera (e.g., front or back).
 */
export type CameraType = 'front' | 'back' | 'unknown';

export type ImageType = 'image/png' | 'image/jpeg';

export type CameraCapturedResult = {
    width: number;
    height: number;
    uri: string;
    timestamp: string;
    base64?: string;
};

export type CameraCaptureOptions = {
    quality?: number;
    scale?: number;
    imageType?: ImageType;
    mirror?: boolean;
    isImageMirror?: boolean;
};

/**
 * Represents the resolution of the camera.
 */
export interface Resolution {
    width: number; // Width in pixels
    height: number; // Height in pixels
    name?: string; // Name of the resolution
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
}

/**
 * Configuration for initializing the camera.
 */
export interface CameraConfig {
    // Required properties
    enableAudio: boolean; // Enable/disable audio
    previewElement: HTMLVideoElement | null; // Video element for preview
    captureElement: HTMLCanvasElement | null; // Canvas element for capturing images

    // Optional properties
    targetResolution?: Resolution; // Target resolution for the camera
    fallbackResolution?: Resolution; // Fallback resolution if target is not supported
    enableMirroring?: boolean; // Enable/disable mirroring of the video feed
    enableAutoRotation?: boolean; // Enable/disable auto-rotation based on device orientation
    selectedDevice?: MediaDeviceInfo; // Selected camera device

    // Callbacks
    onStateChange?: (state: CameraRuntimeState) => void; // Callback for state changes
    onCameraStart?: () => void; // Callback when the camera starts
    onCameraStop?: () => void; // Callback when the camera stops
    onError?: (error: CameraEventDetail) => void; // Callback when an error occurs
}

/**
 * Represents the runtime state of the camera.
 */
export interface CameraRuntimeState extends CameraConfig {
    devices: MediaDeviceInfo[]; // List of available camera devices
    activeDevice?: MediaDeviceInfo; // Currently active camera device
    activeResolution?: Resolution; // Currently active resolution
    activeStream?: MediaStream; // Currently active media stream
    hasMultipleDevices: boolean; // Whether multiple devices are available
    cameraType: CameraType; // Type of camera (e.g., front, back)
    isActive: boolean; // Whether the camera is currently active
    isInitializing: boolean; // Whether the camera is initializing
    capabilities?: CameraCapabilities; // Capabilities of the active camera
    currentSettings?: CameraSettings; // Current camera settings
    supportsTorch: boolean; // Whether the camera supports torch/flash
    supportsFocus: boolean; // Whether the camera supports focus
    supportsZoom: boolean; // Whether the camera supports zoom
    supportsRecording: boolean; // Whether the camera supports recording
    isTorchEnabled: boolean; // Whether the torch is currently enabled
    lastCapturedImage?: CameraCapturedResult; // Last captured image result
    error?: CameraError<CameraErrorCode>; // Last error encountered
}
