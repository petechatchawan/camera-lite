

import { CameraConfiguration, CameraSettings, CameraState, CameraType, PermissionResponse, PermissionStatus, Resolution } from "../types/camera.types";
import { CameraError } from "../types/error.types";
import { EventDetail, EventManager, EventType } from "./event-manager";

export class CameraManager {
    private readonly events = new EventManager();
    private currentState: CameraState = {
        devices: [],
        activeDevice: undefined,
        userPreferredDevice: undefined,
        stream: undefined,
        isStreaming: false,
        capabilities: undefined,
        currentSettings: undefined,
        hasMultipleDevices: false,
        error: undefined,
        isRecording: false,
        recordedChunks: [],
        configuration: {
            previewElement: null,
            captureElement: null,
            isAudioEnabled: false,
            selectedDevice: null,
            cameraType: 'front',
            targetResolution: { width: 1280, height: 720 },
            fallbackResolution: { width: 640, height: 480 },
            isMirrored: false,
            isAutoRotate: false,
            // initialConstraints: {},
            // captureFormat: 'image/jpeg',
        },
        lastCapturedImage: undefined,
        // frameRate: undefined,
        // latency: undefined,
        isMirrored: false,
        // isFullscreen: false,
        supportsTorch: false,
        supportsFocus: false,
        supportsZoom: false,
        supportsRecording: false
    }

    //#region State Management
    // public get devices(): MediaDeviceInfo[] {
    //     return this.currentState.devices;
    // }

    // public get stream(): MediaStream | undefined {
    //     return this.currentState.stream || undefined;
    // }

    // public get configuration(): CameraConfiguration {
    //     return this.currentState.configuration;
    // }

    //#region Event Management
    private setupChangeListeners(): void {
        // 1. Handle Device Changes
        navigator.mediaDevices.addEventListener('devicechange', async () => {
            // todo: handle device changes
            // await this.refreshDeviceList();
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
        } catch (e) {
            const cameraError = new CameraError('camera-start-error', 'Failed to obtain user media', e instanceof Error ? e : undefined);
            this.handleError(cameraError);
            throw cameraError;
        }
    }

    async startStream() {
        try {
            // todo: clear state before starting
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

            // camera can be started
            // todo: update state after starting

            // ? set preview
            await this.setPreviewStream(stream);

            // ? update stream configuration
            this.updateStreamSettings(stream);

            // ? update mirror effect
            this.applyMirrorEffect();

        } catch (error) {

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
                    this.emitEvent('streamStart', { status: 'success' });
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
        this.currentState.activeDevice = selectedCamera;
        this.currentState.activeResolution = actualResolution;
        this.currentState.configuration = updatedConfig;


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


    //#region Camera Control
    async initialize(config: CameraConfiguration): Promise<void> {
        try {
            this.currentState.configuration = {
                ...this.currentState.configuration,
                ...config
            };

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
            this.handleError(
                new CameraError(
                    'camera-initialization-error',
                    'Failed to initialize camera',
                    error instanceof Error ? error : undefined
                )
            );
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
