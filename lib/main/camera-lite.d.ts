import { CameraCapturedResult, CameraCaptureOptions, CameraRuntimeState, CameraSettings, MaxResolution, PermissionResponse, Resolution, ResolutionSupport } from '../types/camera.types';
export declare function getInitialCameraState(): CameraRuntimeState;
export declare class CameraLite {
    private static readonly STANDARD_RESOLUTIONS;
    private readonly state;
    constructor();
    checkOrientation(): void;
    private updateCameraState;
    private get cameraState();
    private resetCameraState;
    getCameraState(): CameraRuntimeState;
    getActiveDevice(): MediaDeviceInfo | undefined;
    getActiveResolution(): Resolution | undefined;
    getCanvasElement(): HTMLCanvasElement | undefined;
    isCameraActive(): boolean;
    isCameraInitializing(): boolean;
    clearError(): void;
    setupChangeListeners(): void;
    private checkPermissionsSupport;
    getCameraPermissions(): Promise<PermissionResponse>;
    getMicrophonePermissions(): Promise<PermissionResponse>;
    private handlePermissionsQuery;
    requestCameraPermissions(): Promise<PermissionResponse>;
    /**
     * Check if the browser supports media devices
     */
    private checkMediaDevicesSupport;
    /**
     * Get list of available camera devices
     */
    getDevices(): Promise<MediaDeviceInfo[]>;
    private updateDeviceList;
    /**
     * Returns the next available camera
     */
    private findNextDevice;
    private requestUserMedia;
    startStream(): Promise<void>;
    private createMediaStreamConstraints;
    private getFinalResolution;
    private setPreviewStream;
    private updateStreamSettings;
    private shouldSwapDimensions;
    private applyMirrorEffect;
    stopStream(): Promise<void>;
    updateSettings(settings: Partial<CameraSettings>): Promise<void>;
    /**
     * Apply camera configuration changes
     */
    applyConfigurationChanges(newConfig: Partial<CameraRuntimeState>, forceRestart?: boolean): Promise<void>;
    private hasSettingsChanged;
    private isConstraintChanged;
    initializeCameraCapabilities(): Promise<MaxResolution[]>;
    private analyzeCameraDevice;
    isResolutionSupportedFromSpecs(maxResolution: MaxResolution, width: number, height: number): boolean;
    checkSupportedResolutionsFromSpecs(maxResolution: MaxResolution, resolutions?: Resolution[]): ResolutionSupport[];
    /**
     * Toggles the torch (flashlight) on the active video stream.
     *
     * @param enable - A boolean indicating whether to enable (true) or disable (false) the torch.
     * @throws Will throw an error if the video stream is not initialized or no video track is found.
     * @throws Will log a warning if the torch capability is not supported on the device.
     * @throws Will handle an error if applying the torch constraint fails.
     */
    enableTorch(enable: boolean): Promise<void>;
    /**
     * Sets the focus mode on the active video stream.
     *
     * @param stream - The active video stream.
     * @param focusMode - The focus mode to set. Can be 'continuous', 'manual', or 'single-shot'.
     * @throws Will do nothing if the video stream is not initialized or no video track is found.
     * @throws Will log a warning if the focus mode capability is not supported on the device.
     * @throws Will handle an error if applying the focus mode constraint fails.
     */
    setFocusMode(stream: MediaStream, focusMode: 'continuous' | 'manual' | 'single-shot'): Promise<void>;
    /**
     * Initializes the camera with the provided configuration.
     * @param config - The configuration for the camera.
     * @throws {CameraError} If initialization fails.
     */
    initialize(config: Partial<CameraRuntimeState>): Promise<void>;
    /**
     * Switches to the next available camera
     */
    switchCamera(): Promise<void>;
    private analyzeCameraError;
    private updateCapabilities;
    toggleMirroring(): void;
    /**
     * Cleans up camera resources by stopping the stream, clearing events, and resetting the configuration.
     */
    destroy(): Promise<void>;
    private removeEventListeners;
    /**
     * Takes a photo from the camera stream.
     *
     * @param options - Capture options.
     * @returns A promise that resolves with a `CameraCapturedResult` object if the photo is taken successfully,
     *          or `null` if an error occurs.
     */
    takePhoto(options: CameraCaptureOptions): Promise<CameraCapturedResult | null>;
    /**
     * Calculates the scaled dimensions of a video based on the given scale factor.
     *
     * @param videoWidth - The original width of the video.
     * @param videoHeight - The original height of the video.
     * @param scale - The scale factor to apply. Must be between 0 and 1.
     * @returns An object containing the calculated width and height.
     *          If the scale is not within the valid range, returns the original dimensions.
     */
    private calculateScaledSize;
    /**
     * Handles an error that occurred in the camera control.
     * @param error The error that occurred.
     * Emits an 'onError' event with the error and logs the error to the console.
     */
    private handleError;
    /**
     * Checks if the error is an OverconstrainedError
     * @param error The error to check
     * @returns Whether the error is an OverconstrainedError
     */
    isOverconstrainedError(error: Error | undefined): error is OverconstrainedError;
    /**
     * Checks if the error is related to the camera being in use.
     *
     * @param error - The error to check. Can be an Error object or undefined.
     * @returns A boolean indicating whether the error is a camera in-use error, specifically 'NotReadableError' or 'AbortError'.
     */
    isCameraInUseError(error: Error | undefined): boolean;
}
