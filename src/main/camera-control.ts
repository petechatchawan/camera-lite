

import { CameraConfiguration, CameraSettings, CameraState, CameraType, MaxResolution, PermissionResponse, PermissionStatus, Resolution, ResolutionSupport } from "../types/camera.types";
import { CameraError } from "../types/error.types";
import { EventDetail, EventManager, EventType } from "./event-manager";

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
    private currentState: CameraState = {
        devices: [],
        hasMultipleDevices: false,
        activeDevice: undefined,
        activeResolution: undefined,
        stream: undefined,
        isActive: false,
        isInitializing: false,
        capabilities: undefined,
        currentSettings: undefined,
        lastCapturedImage: undefined,
        isMirrored: false,
        supportsTorch: false,
        supportsFocus: false,
        supportsZoom: false,
        supportsRecording: false,
        error: undefined,
        configuration: {
            previewElement: null,
            captureElement: null,
            isAudioEnabled: false,
            selectedDevice: null,
            cameraType: 'front',
            targetResolution: undefined,
            fallbackResolution: undefined,
            isMirrored: false,
            isAutoRotate: false,
        },
    }

    constructor() {
        console.log("[CameraControl] Constructing...");
        this.setupChangeListeners();
    }

    //#region State Management
    public get state(): CameraState {
        return this.currentState;
    }

    public getActiveDevice(): MediaDeviceInfo | undefined {
        return this.currentState.activeDevice || undefined;
    }

    public getActiveResolution(): Resolution | undefined {
        return this.currentState.activeResolution || undefined;
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

    /**
     * Subscribe to a specific event.
     * @param event The type of event.
     * @param callback The callback to execute when the event is emitted.
     */
    onEvent(event: EventType, callback: (detail: EventDetail) => void): void {
        this.events.on(event, callback);
    }

    /**
     * Unsubscribe from a specific event.
     * @param event The type of event.
     * @param callback The callback to remove.
     */
    offEvent(event: EventType, callback: (detail: EventDetail) => void): void {
        this.events.off(event, callback);
    }

    /**
     * Emit an event with details.
     * @param event The type of event.
     * @param detail The event details.
     */
    emitEvent(event: EventType, detail: EventDetail): void {
        try {
            this.events.emit(event, detail);
        } catch (error) {
            console.error(`Error emitting event ${event}`, error);
        }
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
        // Return cached devices if available
        if (this.currentState.devices.length > 0) {
            return this.currentState.devices;
        }

        try {
            await this.updateDeviceList();
            if (this.currentState.devices.length === 0) {
                throw new CameraError(
                    'no-device',
                    'No video input devices found'
                );
            }

            return this.currentState.devices;
        } catch (e) {
            this.handleError(e);
            return [];
        }
    }

    private async updateDeviceList(): Promise<void> {
        // Check browser support
        this.checkMediaDevicesSupport();

        // Update device list
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.currentState.devices = devices.filter(device => device.kind === 'videoinput');
        this.currentState.hasMultipleDevices = this.currentState.devices.length > 1;
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
            this.currentState.isInitializing = true;
            this.currentState.isActive = false;
            this.currentState.error = undefined;

            // Start camera
            const useFallbackMode = this.currentState.configuration.fallbackResolution ? true : false;
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

            // ? update mirror effect
            this.applyMirrorEffect();

            // todo: update state after starting
            // update state after starting
            this.currentState.isActive = true;
            this.emitEvent('streamStart', {
                status: 'success', data: {
                    activeDevice: this.currentState.activeDevice,
                    activeResolution: this.currentState.activeResolution
                }
            });
        } catch (error) {
            // update state after error
            this.currentState.isActive = false;
            throw new CameraError(
                'camera-start-error',
                'Failed to start camera',
                error instanceof Error ? error : undefined
            );
        } finally {
            this.currentState.isInitializing = false;
        }
    }

    private createMediaStreamConstraints(fallbackMode: boolean = false): MediaStreamConstraints {
        const resolution = fallbackMode
            ? this.currentState.configuration.fallbackResolution ?? {
                width: 1280,
                height: 720,
                aspectRatio: 16 / 9,
                name: '720p',
            }
            : this.currentState.configuration.targetResolution ?? {
                width: 1280,
                height: 720,
                aspectRatio: 16 / 9,
                name: '720p',
            };

        const autoSwapResolution = this.currentState.configuration.isAutoRotate ?? false;
        const finalResolution = this.getFinalResolution(resolution, autoSwapResolution);
        const videoConstraints: MediaTrackConstraints = {
            deviceId: this.currentState.configuration.selectedDevice?.deviceId
                ? { exact: this.currentState.configuration.selectedDevice.deviceId }
                : undefined,
            facingMode: this.currentState.configuration.selectedDevice?.deviceId
                ? undefined
                : this.currentState.configuration.cameraType,
            width: { exact: finalResolution.width },
            height: { exact: finalResolution.height },
            // aspectRatio: { ideal: finalResolution.aspectRatio },
        };

        if (videoConstraints.facingMode === undefined) {
            delete videoConstraints.facingMode;
        }

        return {
            audio: this.currentState.configuration.isAudioEnabled,
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
                // aspectRatio: 1 / resolution.aspectRatio,
                // name: resolution.name,
            };
        }
        return resolution;
    }

    private async setPreviewStream(stream: MediaStream): Promise<void> {
        if (this.currentState.configuration.previewElement && stream) {
            this.currentState.configuration.previewElement.srcObject = stream;
            await new Promise(resolve => {
                if (!this.currentState.configuration.previewElement) {
                    return resolve(false);
                }

                this.currentState.configuration.previewElement.onloadedmetadata = () => {
                    resolve(true);
                };
            });
        }
    }

    private updateStreamSettings(stream: MediaStream): void {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getSettings();
        const { width = 0, height = 0, deviceId, aspectRatio, facingMode } = capabilities;

        // หาข้อมูลกล้องที่กำลังใช้งาน
        const selectedCamera = this.currentState.devices.find(camera => camera.deviceId === deviceId);
        if (!selectedCamera) {
            console.warn('Selected camera not found in available devices');
        }

        // ตรวจสอบว่าได้ความละเอียดที่ต้องการหรือไม่
        const requestedResolution = this.currentState.configuration.targetResolution ?? null;
        const autoSwapResolution = this.currentState.configuration.isAutoRotate ?? false;

        // ตรวจสอบว่าต้องสลับ width/height หรือไม่
        const shouldSwapDimensions = requestedResolution !== null &&
            this.shouldSwapDimensions(
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
            // name: this.getResolutionPresetName(
            //     shouldSwapDimensions ? height : width,
            //     shouldSwapDimensions ? width : height
            // ),
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
        const updatedConfig: CameraConfiguration = {
            ...this.currentState.configuration,
            targetResolution: actualResolution,
            selectedDevice: selectedCamera ?? undefined,
            cameraType: (facingMode as CameraType) || this.currentState.configuration.cameraType,
        };

        // update state
        this.currentState.stream = stream;
        this.currentState.isActive = true;
        this.currentState.activeDevice = selectedCamera;
        this.currentState.activeResolution = actualResolution;
        this.currentState.configuration = updatedConfig;

        console.log('Updated camera state:', this.currentState);
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
        if (this.currentState.configuration.previewElement) {
            this.currentState.configuration.previewElement.style.transform =
                this.currentState.configuration.isMirrored
                    ? 'scaleX(-1)'
                    : 'scaleX(1)';
        }
    }

    async stopStream(): Promise<void> {
        try {
            if (this.currentState.stream) {
                this.currentState.stream.getTracks().forEach(track => track.stop());
                this.currentState.stream = undefined;
            }

            if (this.currentState.configuration.previewElement) {
                this.currentState.configuration.previewElement.srcObject = null;
            }

            this.emitEvent('streamStop', { status: 'success' });
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
            if (!this.currentState.stream) {
                throw new CameraError('no-stream', 'No stream to update settings on');
            }

            const videoTrack = this.currentState.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            const newSettings: Partial<MediaTrackSettings> = {};

            // Update zoom if supported
            // if (settings.zoom !== undefined && capabilities.zoom) {
            //     newSettings.zoom = settings.zoom;
            // }

            // // Update focus if supported
            // if (settings.focus?.mode && capabilities.focusMode) {
            //     newSettings.focusMode = settings.focus.mode;
            // }

            await videoTrack.applyConstraints({ advanced: [newSettings] });

            this.currentState.currentSettings = {
                ...this.currentState.currentSettings,
                ...settings
            };

            this.emitEvent('onSettingsChange', { status: 'success' });
        } catch (e) {
            this.handleError(
                new CameraError(
                    'camera-settings-error',
                    'Failed to update camera settings',
                    e instanceof Error ? e : undefined
                )
            );
        }
    }
    //#endregion

    //#region Camera Capabilities
    async initializeCameraCapabilities(): Promise<MaxResolution[]> {
        try {
            // ขอ permission และดึงรายการกล้องทั้งหมด
            const devices = await this.getVideoDevices();

            // วิเคราะห์ความสามารถของทุกกล้องพร้อมกัน
            const capabilities = await Promise.all(devices.map(device => this.analyzeCameraDevice(device)));

            return capabilities.filter(Boolean) as MaxResolution[];
        } catch (error) {
            console.error('Failed to initialize camera capabilities:', error);
            throw error;
        }
    }

    private async getVideoDevices(): Promise<MediaDeviceInfo[]> {
        // ขอ permission ก่อนเพื่อให้เห็น device labels
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
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
    //#endregion


    //#region Camera Control
    async initialize(config: CameraConfiguration): Promise<void> {
        try {
            this.currentState.configuration = {
                ...this.currentState.configuration,
                ...config
            };

            console.log("CurrentState configuration: ", this.currentState.configuration);

            // Check browser support
            this.checkMediaDevicesSupport();

            // Get available devices
            await this.updateDeviceList();

            // ? set and start stream
            // Set initial constraints
            // Start stream with initial configuration
            await this.startStream();

            // Update capabilities
            await this.updateCapabilities();
        } catch (error) {
            console.error('Failed to initialize camera:', error);
            this.currentState.error = error instanceof CameraError
                ? error
                : new CameraError('unknown', 'An unknown error occurred');
            throw error;
        }
    }

    private async updateCapabilities(): Promise<void> {
        if (!this.currentState.stream) return;

        const videoTrack = this.currentState.stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();

        this.currentState.supportsTorch = 'torch' in capabilities;
        this.currentState.supportsFocus = 'focusMode' in capabilities;
        this.currentState.supportsZoom = 'zoom' in capabilities;
    }

    public async destroy(): Promise<void> {
        this.stopStream();
        this.events.clear();
        this.currentState.configuration = {};
    }
    //#endregion


    //#region Events (Wrapped to maintain reference equality)
    /**
     * Handle camera errors
     */
    private handleError(error: unknown): void {
        const cameraError = error instanceof CameraError
            ? error
            : new CameraError(
                'unknown',
                error instanceof Error ? error.message : 'An unknown error occurred',
                error instanceof Error ? error : undefined
            );

        this.events.emit('error', {
            status: 'error',
            error: cameraError
        });

        console.error('[Camera Error]:', cameraError.toString());
    }
    //#endregion
}
