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
    devices: MediaDeviceInfo[];
    activeDevice?: MediaDeviceInfo;
    userPreferredDevice?: MediaDeviceInfo;
    stream?: MediaStream;
    isStreaming: boolean;
    hasPermission: boolean;
    permissionDenied: boolean;
    hasMultipleDevices: boolean;
    error?: Error;
    isRecording: boolean;
    recordedChunks: Blob[];
    lastCapturedImage?: Blob;
    frameRate?: number;
    latency?: number;
    isMirrored: boolean;
    isFullscreen: boolean;
    supportsTorch: boolean;
    supportsFocus: boolean;
    supportsZoom: boolean;
}
