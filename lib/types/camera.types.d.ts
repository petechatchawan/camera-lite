import { CameraError, CameraErrorCode, CameraEventDetail } from './error.types';
export declare enum PermissionStatus {
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
/**
 * Represents the orientation of the device.
 */
export interface Orientation {
    type: 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';
    angle: number;
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
    width: number;
    height: number;
    name?: string;
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
    enableAudio: boolean;
    previewElement: HTMLVideoElement | null;
    captureElement: HTMLCanvasElement | null;
    targetResolution?: Resolution;
    fallbackResolution?: Resolution;
    enableMirroring?: boolean;
    enableAutoRotation?: boolean;
    selectedDevice?: MediaDeviceInfo;
    onStateChange?: (state: CameraRuntimeState) => void;
    onCameraStart?: () => void;
    onCameraStop?: () => void;
    onError?: (error: CameraEventDetail) => void;
}
/**
 * Represents the runtime state of the camera.
 */
export interface CameraRuntimeState extends CameraConfig {
    devices: MediaDeviceInfo[];
    activeDevice?: MediaDeviceInfo;
    activeResolution?: Resolution;
    activeStream?: MediaStream;
    hasMultipleDevices: boolean;
    cameraType: CameraType;
    isActive: boolean;
    isInitializing: boolean;
    capabilities?: CameraCapabilities;
    currentSettings?: CameraSettings;
    supportsTorch: boolean;
    supportsFocus: boolean;
    supportsZoom: boolean;
    supportsRecording: boolean;
    isTorchEnabled: boolean;
    lastCapturedImage?: CameraCapturedResult;
    error?: CameraError<CameraErrorCode>;
}
