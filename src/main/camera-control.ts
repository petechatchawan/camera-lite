


import { CameraCapturedResult, CameraCaptureOptions, CameraSettings, CameraState, CameraType, MaxResolution, PermissionResponse, PermissionStatus, Resolution, ResolutionSupport } from "../types/camera.types";
import { CameraError, CameraErrorCode } from "../types/error.types";
import { EventManager } from "./event-manager";

// Default State Factory
function getInitialCameraState(): CameraState {
    return {
        // Device Information
        devices: [],
        hasMultipleDevices: false,
        activeDevice: undefined,
        selectedDevice: null,
        cameraType: 'front',

        // Stream and Activity State
        stream: null,
        isActive: false,
        isInitializing: false,

        // Settings and Capabilities
        capabilities: undefined,
        currentSettings: undefined,
        isAudioEnabled: false,
        targetResolution: undefined,
        fallbackResolution: undefined,
        isAutoRotate: false,

        // Elements
        previewElement: null,
        captureElement: null,

        // Features Support
        supportsTorch: false,
        supportsFocus: false,
        supportsZoom: false,
        supportsRecording: false,

        // UI State
        isMirrored: false,

        // Results
        lastCapturedImage: undefined,

        // Error Handling
        error: undefined
    };
}


export class CameraControl {
    private static readonly STANDARD_RESOLUTIONS: Resolution[] = [
        // Landscape orientations
        { width: 640, height: 480, name: 'VGA Landscape' },
        { width: 1280, height: 720, name: 'HD Landscape' },
        { width: 1920, height: 1080, name: 'Full HD Landscape' },
        { width: 2560, height: 1440, name: 'QHD Landscape' },
        { width: 3840, height: 2160, name: '4K Landscape' },

        // Portrait orientations
        { width: 480, height: 640, name: 'VGA Portrait' },
        { width: 720, height: 1280, name: 'HD Portrait' },
        { width: 1080, height: 1920, name: 'Full HD Portrait' },
        { width: 1440, height: 2560, name: 'QHD Portrait' },
        { width: 2160, height: 3840, name: '4K Portrait' },

        // Common mobile resolutions landscape
        { width: 854, height: 480, name: 'FWVGA Landscape' },
        { width: 960, height: 540, name: 'qHD Landscape' },
        { width: 1600, height: 900, name: 'HD+ Landscape' },
        { width: 2048, height: 1152, name: '2K Landscape' },

        // Common mobile resolutions portrait
        { width: 480, height: 854, name: 'FWVGA Portrait' },
        { width: 540, height: 960, name: 'qHD Portrait' },
        { width: 900, height: 1600, name: 'HD+ Portrait' },
        { width: 1152, height: 2048, name: '2K Portrait' }
    ];

    private readonly events = new EventManager();
    private cameraState: CameraState = getInitialCameraState();

    constructor() {
        console.log("[CameraControl] Constructing...");
        this.setupChangeListeners();
    }

    //#region State Management

    // Methods for updating state
    private updateCameraState(newState: Partial<CameraState>): void {
        // อัปเดตสถานะ
        const updatedState = { ...this.cameraState, ...newState };

        // เรียก Callback หากถูกกำหนด
        if (this.cameraState.onStateChange) {
            this.cameraState.onStateChange(updatedState);
        }

        // อัปเดตสถานะใหม่ในตัวแปร
        Object.assign(this.cameraState, updatedState);

        console.log("Updated CameraState:", this.cameraState);
    }

    // Reset state
    private resetCameraState() {
        this.cameraState = getInitialCameraState();
    }

    public getCameraState(): CameraState {
        return this.cameraState;
    }

    public getActiveDevice(): MediaDeviceInfo | undefined {
        return this.cameraState.activeDevice || undefined;
    }

    public getActiveResolution(): Resolution | undefined {
        return this.cameraState.activeResolution || undefined;
    }

    //#region Event Management
    private setupChangeListeners(): void {
        navigator.mediaDevices.addEventListener('devicechange', async () => {
            // ? Handle Device Changes
            await this.updateDeviceList();
        });

        // 2. Handle Visibility Change
        document.addEventListener('visibilitychange', () => {
            // todo: handle visibility change
            // this.handleVisibilityChange();
        });

        // 3. Handle Orientation Change
        window.addEventListener('orientationchange', () => {
            // todo: handle orientation change
            // this.handleOrientationChange();
        });
    }
    //#endregion

    //#region Permission Management
    private checkPermissionsSupport(): boolean {
        if (!navigator?.permissions?.query) {
            throw new CameraError(
                'no-permissions-api',
                'MediaDevices API not supported in this browser');
        }
        return true;
    }

    public async getCameraPermissions(): Promise<PermissionResponse> {
        return await this.handlePermissionsQuery('camera');
    };

    public async getMicrophonePermissions(): Promise<PermissionResponse> {
        return await this.handlePermissionsQuery('microphone');
    };

    private async handlePermissionsQuery(query: 'camera' | 'microphone'): Promise<PermissionResponse> {
        try {
            // Check Permissions API support
            this.checkPermissionsSupport();

            // Request permission
            const { state } = await navigator.permissions.query({ name: query as PermissionName });
            switch (state) {
                case 'prompt':
                    return {
                        status: PermissionStatus.UNDETERMINED,
                        granted: false,
                    };
                case 'granted':
                    return {
                        status: PermissionStatus.GRANTED,
                        granted: true,
                    };
                case 'denied':
                    return {
                        status: PermissionStatus.DENIED,
                        granted: false,
                    };
            }
        } catch (e) {
            // Firefox doesn't support querying for the camera permission, so return undetermined status
            if (e instanceof TypeError) {
                return {
                    status: PermissionStatus.UNDETERMINED,
                    granted: false,
                };
            }
            throw e;
        }
    }

    async requestCameraPermissions(): Promise<PermissionResponse> {
        try {
            const stream = await this.requestUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());

            return {
                status: PermissionStatus.GRANTED,
                granted: true,
            };
        } catch (error) {
            if (error instanceof Error) {
                switch (error.name) {
                    case 'NotAllowedError':
                    case 'PermissionDeniedError':
                        return {
                            status: PermissionStatus.DENIED,
                            granted: false,
                        };
                    default:
                        return {
                            status: PermissionStatus.UNDETERMINED,
                            granted: false,
                        };
                }
            }
            return {
                status: PermissionStatus.UNDETERMINED,
                granted: false,
            };
        }
    }
    //#endregion

    //#region Device Management
    /**
    * Check if the browser supports media devices
    */
    private checkMediaDevicesSupport(): boolean {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices || !navigator.mediaDevices.getUserMedia) {
            throw new CameraError(
                'no-media-devices-support',
                'The browser does not support the MediaDevices API'
            );
        }
        return true;
    }


    /**
     * Get list of available camera devices
     */
    public async getDevices(): Promise<MediaDeviceInfo[]> {
        console.log('Requesting available camera devices');

        // Return cached devices if available
        if (this.cameraState.devices.length > 0) {
            console.log('Using cached camera devices');
            return this.cameraState.devices;
        }

        try {
            console.log('Updating device list');
            await this.updateDeviceList();
            if (this.cameraState.devices.length === 0) {
                console.log('No video input devices found');
                throw new CameraError(
                    'no-device',
                    'No video input devices found'
                );
            }

            console.log('Returning available camera devices');
            return this.cameraState.devices;
        } catch (error) {
            console.log('Error getting available camera devices', error);
            this.handleError(error);
            return [];
        }
    }

    private async updateDeviceList(): Promise<void> {
        // Check browser support
        this.checkMediaDevicesSupport();

        // Update device list
        // Enumerate available devices
        const updatedDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = updatedDevices.filter(device => device.kind === 'videoinput');
        this.updateCameraState({
            devices: videoDevices,
            hasMultipleDevices: this.cameraState.devices.length > 1
        });
    }

    /**
   * Returns the next available camera
   */
    private async findNextDevice(): Promise<MediaDeviceInfo | null> {
        const devices = await this.getDevices();
        if (devices.length <= 1) {
            return null;
        }

        const selectedDevice = this.cameraState.activeDevice;
        const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice?.deviceId);
        return devices[(currentIndex + 1) % devices.length];
    }

    //#endregion

    //#region Stream Management
    private async requestUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            throw error;
        }
    }

    async startStream() {
        try {
            // todo: clear state before starting
            // update state before starting
            this.updateCameraState({
                isInitializing: true,
                isActive: false,
                error: undefined
            });

            // stop old stream
            await this.stopStream();

            // Start camera
            const useFallbackMode = this.cameraState.fallbackResolution ? true : false;
            const constraints = this.createMediaStreamConstraints(useFallbackMode);
            const stream = await this.requestUserMedia(constraints);
            if (!stream) {
                throw new CameraError(
                    'no-stream',
                    'Failed to start camera'
                );
            }

            // ? set preview
            await this.setPreviewStream(stream);

            // ? update stream configuration
            this.updateStreamSettings(stream);

            // Update capabilities
            await this.updateCapabilities();

            // ? update mirror effect
            this.applyMirrorEffect();

            // todo: update state after starting
            // update state after starting
            this.updateCameraState({ isActive: true });

            // ? call onStarted
            if (this.cameraState.onStarted) {
                this.cameraState.onStarted();
            }
        } catch (error) {
            // update state after error
            this.updateCameraState({ isActive: false });
            throw new CameraError(
                'camera-start-error',
                'Failed to start camera',
                error instanceof Error ? error : undefined
            );
        } finally {
            this.updateCameraState({ isInitializing: false });
        }
    }

    private createMediaStreamConstraints(fallbackMode: boolean = false): MediaStreamConstraints {
        const resolution = fallbackMode
            ? this.cameraState.fallbackResolution ?? {
                width: 1280,
                height: 720,
                aspectRatio: 16 / 9,
                name: '720p',
            }
            : this.cameraState.targetResolution ?? {
                width: 1280,
                height: 720,
                aspectRatio: 16 / 9,
                name: '720p',
            };

        const autoSwapResolution = this.cameraState.isAutoRotate ?? false;
        const finalResolution = this.getFinalResolution(resolution, autoSwapResolution);
        const videoConstraints: MediaTrackConstraints = {
            deviceId: this.cameraState.selectedDevice?.deviceId
                ? { exact: this.cameraState.selectedDevice.deviceId }
                : undefined,
            facingMode: this.cameraState.selectedDevice?.deviceId
                ? undefined
                : this.cameraState.cameraType,
            width: { exact: finalResolution.width },
            height: { exact: finalResolution.height },
        };

        if (videoConstraints.facingMode === undefined) {
            delete videoConstraints.facingMode;
        }

        return {
            audio: this.cameraState.isAudioEnabled,
            video: videoConstraints,
        };
    }

    private getFinalResolution(resolution: Resolution, autoSwapResolution: boolean): Resolution {
        // const isMobile = this.uaInfo.isMobile() || this.uaInfo.isTablet();
        const isMobile = navigator.maxTouchPoints > 3;
        if (autoSwapResolution && isMobile) {
            return {
                width: resolution.height,
                height: resolution.width,
                name: resolution.name,
                // aspectRatio: 1 / resolution.aspectRatio,
            };
        }
        return resolution;
    }

    private async setPreviewStream(stream: MediaStream): Promise<void> {
        if (this.cameraState.previewElement && stream) {
            this.cameraState.previewElement.srcObject = stream;
            await new Promise(resolve => {
                if (!this.cameraState.previewElement) {
                    return resolve(false);
                }

                this.cameraState.previewElement.onloadedmetadata = () => {
                    resolve(true);
                };
            });
        }
    }

    private updateStreamSettings(stream: MediaStream): void {
        console.log("Stream", stream);
        if (stream === null) {
            console.warn('updateStreamSettings: stream is null');
            return;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getSettings();
        const { width = 0, height = 0, deviceId, facingMode } = capabilities;

        // หาข้อมูลกล้องที่กำลังใช้งาน
        const selectedCamera = this.cameraState.devices.find(camera => camera.deviceId === deviceId);
        if (!selectedCamera) {
            console.warn('Selected camera not found in available devices');
        }

        // update current camera type


        // ตรวจสอบว่าได้ความละเอียดที่ต้องการหรือไม่
        const requestedResolution = this.cameraState.targetResolution ?? null;
        const autoSwapResolution = this.cameraState.isAutoRotate ?? false;

        // ตรวจสอบว่าต้องสลับ width/height หรือไม่
        const shouldSwapDimensions = requestedResolution !== null && this.shouldSwapDimensions(
            requestedResolution,
            { width, height },
            autoSwapResolution ?? false
        );

        // สร้าง actualResolution โดยพิจารณาการสลับ width/height
        const actualResolution: Resolution = {
            width: shouldSwapDimensions ? height : width,
            height: shouldSwapDimensions ? width : height,
            // aspectRatio: shouldSwapDimensions
            //     ? height / width
            //     : aspectRatio || (width && height ? width / height : 0),
            name: requestedResolution?.name || 'unknown',
        };

        // ถ้าความละเอียดไม่ตรงกับที่ขอ ให้แจ้งเตือน
        if (requestedResolution && (requestedResolution.width !== actualResolution.width || requestedResolution.height !== actualResolution.height)
        ) {
            console.warn(
                `Requested resolution (${requestedResolution.width}x${requestedResolution.height}) ` +
                `differs from actual resolution (${actualResolution.width}x${actualResolution.height})` +
                (shouldSwapDimensions ? ' (dimensions were swapped)' : '')
            );
        }

        // update configuration
        const updatedConfig: Partial<CameraState> = {
            targetResolution: actualResolution,
            selectedDevice: selectedCamera ?? undefined,
            cameraType: (facingMode as CameraType) || this.cameraState.cameraType,
        };

        // update state
        console.log('Updating camera state:', updatedConfig);
        this.updateCameraState({
            stream: stream,
            isActive: true,
            activeDevice: selectedCamera,
            activeResolution: actualResolution,
            ...updatedConfig,
        });
        console.log('Updated camera state:', this.cameraState);
    }

    private shouldSwapDimensions(
        requested: Resolution | undefined,
        actual: { width: number; height: number },
        autoSwapEnabled: boolean
    ): boolean {
        if (!requested || !autoSwapEnabled) {
            return false;
        }

        const currentAspectRatio = actual.width / actual.height;
        const requestedAspectRatio = requested.width / requested.height;

        if (Math.abs(currentAspectRatio - requestedAspectRatio) > 0.01) {
            const swappedWidth = actual.height;
            const swappedHeight = actual.width;

            return (
                (swappedWidth === requested.width && swappedHeight === requested.height) ||
                Math.abs(swappedWidth / swappedHeight - requestedAspectRatio) <
                Math.abs(currentAspectRatio - requestedAspectRatio)
            );
        }

        return false;
    }

    private applyMirrorEffect(): void {
        if (this.cameraState.previewElement) {
            this.cameraState.previewElement.style.transform =
                this.cameraState.isMirrored
                    ? 'scaleX(-1)'
                    : 'scaleX(1)';
        }
    }

    async stopStream(): Promise<void> {
        try {
            if (this.cameraState.stream) {
                this.cameraState.stream.getTracks().forEach(track => track.stop());
                this.updateCameraState({ stream: undefined });

                if (this.cameraState.onStopped) {
                    this.cameraState.onStopped();
                }
            }

            if (this.cameraState.previewElement) {
                this.cameraState.previewElement.srcObject = null;
            }
        } catch (error) {
            console.error('Error destroying camera:', error);
            this.handleError(
                new CameraError(
                    'camera-stop-error',
                    'Failed to stop camera',
                    error instanceof Error ? error : undefined
                )
            );
        }
    }

    public async updateSettings(settings: Partial<CameraSettings>): Promise<void> {
        try {
            if (!this.cameraState.stream) {
                throw new CameraError('no-stream', 'No stream to update settings on');
            }

            const videoTrack = this.cameraState.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            const newSettings: Partial<MediaTrackSettings> = {};

            // Update zoom if supported
            // if (settings.zoom !== undefined && capabilities.zoom) {
            //     newSettings.zoom = settings.zoom;
            // }

            // Update focus if supported
            // if (settings.focus?.mode && capabilities.focusMode) {
            //     newSettings.focusMode = settings.focus.mode;
            // }

            await videoTrack.applyConstraints({ advanced: [newSettings] });

            // Update state
            this.updateCameraState({
                currentSettings: {
                    ...this.cameraState.currentSettings,
                    ...settings
                }
            });

            // todo: callback
            // this.emitEvent('onSettingsChange', { status: 'success' });
        } catch (error) {
            this.handleError(
                new CameraError(
                    'camera-settings-error',
                    'Failed to update camera settings',
                    error instanceof Error ? error : undefined
                )
            );
        }
    }

    /**
  * Apply camera configuration changes
  */
    public async applyConfigurationChanges(
        newConfig: Partial<CameraState>,
        forceRestart: boolean = false
    ): Promise<void> {
        const prevConfig = this.cameraState;
        const isDeviceChanged = newConfig.selectedDevice?.deviceId !== prevConfig.selectedDevice?.deviceId;
        const isFacingModeChanged = newConfig.cameraType !== prevConfig.cameraType;
        const isResolutionChanged = newConfig.targetResolution && (newConfig.targetResolution.width !== prevConfig.targetResolution?.width || newConfig.targetResolution.height !== prevConfig.targetResolution?.height);
        const updatedConfig: Partial<CameraState> = {
            ...prevConfig,
            ...newConfig,
        };

        // update state
        this.updateCameraState(updatedConfig);

        // apply changes
        if (!this.cameraState.stream || !this.cameraState.previewElement) {
            await this.startStream();
            return;
        }

        if (isDeviceChanged || isFacingModeChanged || isResolutionChanged || forceRestart) {
            await this.startStream();
            return;
        }

        const track = this.cameraState.stream.getVideoTracks()[0];
        if (!track) {
            throw new Error('No video track found');
        }

        const currentSettings = track.getSettings();
        const newConstraints = this.createMediaStreamConstraints();
        const needsUpdate = this.hasSettingsChanged(currentSettings, newConstraints.video as MediaTrackConstraints);

        if (needsUpdate) {
            try {
                await track.applyConstraints(newConstraints.video as MediaTrackConstraints);
            } catch (error) {
                this.updateCameraState(prevConfig);
                throw error;
            }
        }

        if (this.cameraState.isMirrored !== prevConfig.isMirrored) {
            this.applyMirrorEffect();
        }
    }

    private hasSettingsChanged(
        currentSettings: MediaTrackSettings,
        newConstraints: MediaTrackConstraints
    ): boolean {
        const significantChanges = [
            this.isConstraintChanged(currentSettings.width, newConstraints.width),
            this.isConstraintChanged(currentSettings.height, newConstraints.height),
            this.isConstraintChanged(currentSettings.facingMode, newConstraints.facingMode),
            this.isConstraintChanged(currentSettings.aspectRatio, newConstraints.aspectRatio),
        ];
        return significantChanges.some(changed => changed);
    }

    private isConstraintChanged(
        currentValue: any,
        newConstraint: ConstrainULong | ConstrainDouble | ConstrainDOMString | undefined
    ): boolean {
        if (!newConstraint) return false;
        if (typeof newConstraint === 'object') {
            const constraintValue = (newConstraint as any).ideal || (newConstraint as any).exact;
            return currentValue !== constraintValue;
        }
        return currentValue !== newConstraint;
    }
    //#endregion

    //#region Camera Capabilities
    async initializeCameraCapabilities(): Promise<MaxResolution[]> {
        try {
            // Get available devices
            const devices = await this.getDevices();

            // Analyze each device
            const capabilities = await Promise.all(devices.map(device => this.analyzeCameraDevice(device)));

            // Filter out null values
            return capabilities.filter(Boolean) as MaxResolution[];
        } catch (error) {
            console.error('Failed to initialize camera capabilities:', error);
            throw error;
        }
    }

    private async analyzeCameraDevice(device: MediaDeviceInfo): Promise<MaxResolution | null> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: device.deviceId },
                    width: { ideal: 4096 },
                    height: { ideal: 2160 }
                }
            });

            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();

            // ทำความสะอาด stream ทันที
            stream.getTracks().forEach(track => track.stop());

            return {
                deviceId: device.deviceId,
                label: device.label,
                maxWidth: settings.width || 0,
                maxHeight: settings.height || 0,
            };
        } catch (error) {
            console.warn(`Could not analyze device ${device.label}:`, error);
            return null;
        }
    }

    // ตรวจสอบ resolution จากข้อมูล MaxResolution โดยไม่ต้องเปิดกล้อง
    isResolutionSupportedFromSpecs(maxResolution: MaxResolution, width: number, height: number): boolean {
        return width <= maxResolution.maxWidth && height <= maxResolution.maxHeight;
    }

    // ตรวจสอบ resolutions ทั้งหมดจากข้อมูล MaxResolution
    checkSupportedResolutionsFromSpecs(
        maxResolution: MaxResolution,
        resolutions: Resolution[] = CameraControl.STANDARD_RESOLUTIONS
    ): ResolutionSupport[] {
        return resolutions.map(resolution => ({
            ...resolution,
            isSupported: this.isResolutionSupportedFromSpecs(
                maxResolution,
                resolution.width,
                resolution.height
            )
        }));
    }

    async enableTorch(enable: boolean) {
        if (!this.cameraState.stream) {
            throw new Error('Stream is not initialized');
        }

        const videoTrack = this.cameraState.stream.getVideoTracks()[0];
        if (!videoTrack) {
            throw new Error('No video track found');
        }

        const capabilities = videoTrack.getCapabilities();
        if (!('torch' in capabilities)) {
            console.warn("Torch is not supported on this device.");
            return;
        }

        try {
            await videoTrack.applyConstraints({
                advanced: [{ torch: enable }] as any,
            });
            console.log(`Torch has been ${enable ? "enabled" : "disabled"}.`);
        } catch (error) {
            this.handleError(new CameraError(
                'torch-error',
                `Failed to ${enable ? "enable" : "disable"} torch: ${error}`,
                error as Error
            ));
        }
    }

    async setFocusMode(stream: MediaStream, focusMode: 'continuous' | 'manual' | 'single-shot') {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();

        if (!('focusMode' in capabilities) || !(capabilities.focusMode as string[]).includes(focusMode)) {
            console.warn(`Focus mode "${focusMode}" is not supported.`);
            return;
        }

        try {
            await videoTrack.applyConstraints({
                advanced: [{ focusMode }] as any,
            });
            console.log(`Focus mode set to "${focusMode}".`);
        } catch (error) {
            console.error("Failed to set focus mode:", error);
        }
    }

    //#endregion

    //#region Camera Control
    async initialize(config: Partial<CameraState>): Promise<void> {
        try {
            // Update configuration
            this.updateCameraState(config);

            // Check browser support
            this.checkMediaDevicesSupport();

            // Check browser support
            this.checkMediaDevicesSupport();

            // Get available devices
            await this.updateDeviceList();

            // ? Set initial constraints and tart stream with initial configuration
            await this.startStream();
        } catch (error) { // ควรระบุ type เป็น unknown
            console.error('Failed to start:', error);

            // แยกการตรวจสอบ error type ให้ชัดเจน
            const baseError = error instanceof CameraError
                ? error
                : (error instanceof Error
                    ? new CameraError('unknown', `${error}`, error)
                    : new CameraError('unknown', 'An unknown error occurred'));

            // ตรวจสอบ originalError ให้แน่ใจว่ามีอยู่จริง
            const cameraError = 'originalError' in baseError
                ? this.analyzeCameraError(baseError.originalError)
                : this.analyzeCameraError(baseError);

            // อัพเดท state และ handle error
            this.updateCameraState({ error: cameraError });
            this.handleError(cameraError);
        }
    }

    /**
  * Switches to the next available camera
  */
    async switchCamera(): Promise<void> {
        try {
            const nextDevice = await this.findNextDevice();
            if (nextDevice) {
                await this.applyConfigurationChanges({ selectedDevice: nextDevice }, true);
            } else {
                throw new Error("No device found");
            }
        } catch (error) {
            console.error('Failed to switch camera:', error);

            // แยกการตรวจสอบ error type ให้ชัดเจน
            const baseError = error instanceof CameraError
                ? error
                : (error instanceof Error
                    ? new CameraError('unknown', `${error}`, error)
                    : new CameraError('unknown', 'An unknown error occurred'));

            // ตรวจสอบ originalError ให้แน่ใจว่ามีอยู่จริง
            const cameraError = 'originalError' in baseError
                ? this.analyzeCameraError(baseError.originalError)
                : this.analyzeCameraError(baseError);

            // อัพเดท state และ handle error
            this.updateCameraState({ error: cameraError });
            this.handleError(cameraError);
        }
    }

    private analyzeCameraError(error: unknown): CameraError<CameraErrorCode> {
        if (error instanceof Error) {
            // NotReadableError หรือ TrackStartError มักเกิดเมื่อกล้องถูกใช้งานโดยแอพอื่น
            if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                return new CameraError(
                    'camera-already-in-use',
                    'Camera is currently in use by another application',
                    error
                );
            }

            // NotFoundError เกิดเมื่อไม่พบกล้อง
            if (error.name === 'NotFoundError') {
                return new CameraError(
                    'no-device',
                    'No camera device was found',
                    error
                );
            }

            // NotAllowedError หรือ PermissionDeniedError เกิดเมื่อผู้ใช้ปฏิเสธการขอใช้กล้อง
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                return new CameraError(
                    'permission-denied',
                    'Camera access permission was denied',
                    error
                )
            }

            // ConstraintNotSatisfiedError เกิดเมื่อไม่สามารถใช้งานตาม constraints ที่กำหนด
            if (error.name === 'ConstraintNotSatisfiedError') {
                return new CameraError(
                    'configuration-error',
                    'Camera could not satisfy the requested constraints',
                    error
                )
            }
        }

        // กรณีอื่นๆ
        return new CameraError(
            'unknown',
            'An unknown error occurred',
            error as Error
        );
    }

    private async updateCapabilities(): Promise<void> {
        console.log("Updating camera capabilities...");
        if (!this.cameraState.stream) {
            console.log("No stream available. Cannot update capabilities.");
            return;
        }

        const videoTrack = this.cameraState.stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();

        console.log("Capabilities:", capabilities);

        // check if capabilities are available
        this.updateCameraState({
            isMirrored: capabilities.facingMode?.includes('user') ?? false,
            supportsTorch: 'torch' in capabilities,
            supportsFocus: 'focusMode' in capabilities,
            supportsZoom: 'zoom' in capabilities
        });
        console.log("Updated capabilities:", this.cameraState);
    }

    /**
     * Cleans up camera resources by stopping the stream, clearing events, and resetting the configuration.
     */
    public async destroy(): Promise<void> {
        this.stopStream();
        this.events.clear();
        this.resetCameraState();
    }
    //#endregion

    /**
     * Takes a photo from the camera stream.
     *
     * @param options - Capture options.
     * @returns A promise that resolves with a `CameraCapturedResult` object if the photo is taken successfully,
     *          or `null` if an error occurs.
     */
    public async takePhoto(options: CameraCaptureOptions): Promise<CameraCapturedResult | null> {
        if (!this.cameraState.stream) {
            throw new Error('Camera is not started');
        }

        const previewElement = this.cameraState.previewElement;
        const captureElement = this.cameraState.captureElement;

        if (!previewElement || !captureElement) {
            throw new Error('Camera is not properly configured');
        }

        try {
            const { videoWidth, videoHeight } = previewElement;
            const { width, height } = this.calculateScaledSize(videoWidth, videoHeight, options.scale ?? 1);

            captureElement.width = width;
            captureElement.height = height;
            const context = captureElement.getContext('2d');
            if (!context) {
                throw new Error('Unable to get canvas context');
            }

            if (options.mirror) {
                context.setTransform(-1, 0, 0, 1, width, 0);
            }

            context.drawImage(previewElement, 0, 0, width, height);
            const dataUrl = captureElement.toDataURL(options.imageType || 'image/jpeg', options.quality ?? 1.0);

            return {
                width,
                height,
                uri: dataUrl,
                base64: dataUrl.split(',')[1],
            };
        } catch (error) {
            this.handleError(new CameraError(
                'camera-take-photo-error',
                'Failed to take photo',
                error instanceof Error ? error : undefined
            ));
            return null;
        }
    }

    /**
     * Calculates the scaled dimensions of a video based on the given scale factor.
     *
     * @param videoWidth - The original width of the video.
     * @param videoHeight - The original height of the video.
     * @param scale - The scale factor to apply. Must be between 0 and 1.
     * @returns An object containing the calculated width and height.
     *          If the scale is not within the valid range, returns the original dimensions.
     */
    private calculateScaledSize(videoWidth: number, videoHeight: number, scale: number): { width: number; height: number } {
        if (scale <= 0 || scale > 1 || scale) {
            return { width: videoWidth, height: videoHeight };
        }

        const width = videoWidth * scale;
        const height = (videoHeight * width) / videoWidth;
        return { width, height };
    }

    //#endregion

    //#region Error Management

    /**
     * Handles an error that occurred in the camera control.
     * @param error The error that occurred.
     * Emits an 'onError' event with the error and logs the error to the console.
     */
    private handleError(error: unknown): void {
        const cameraError = error instanceof CameraError
            ? error
            : new CameraError(
                'unknown',
                error instanceof Error ? error.message : 'An unknown error occurred',
                error instanceof Error ? error : undefined
            );

        // เรียก Callback หากถูกกำหนด
        if (this.cameraState.onError) {
            this.cameraState.onError({
                status: 'error',
                error: cameraError
            });
        }

        console.error('[Camera Error]:', cameraError.toString());
    }

    /**
     * Checks if the error is an OverconstrainedError
     * @param error The error to check
     * @returns Whether the error is an OverconstrainedError
     */
    public isOverconstrainedError(error: Error | undefined): error is OverconstrainedError {
        return error instanceof Error && error.name === 'OverconstrainedError';
    }

    /**
     * Checks if the error is related to the camera being in use.
     * 
     * @param error - The error to check. Can be an Error object or undefined.
     * @returns A boolean indicating whether the error is a camera in-use error, specifically 'NotReadableError' or 'AbortError'.
     */
    public isCameraInUseError(error: Error | undefined) {
        return error instanceof Error && (error.name === 'NotReadableError' || error.name === 'AbortError');
    }
    //#endregion
}
