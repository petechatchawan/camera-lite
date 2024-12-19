

import { async, BehaviorSubject, Observable } from "rxjs";
import { CameraError, CameraErrorCode } from "../types/error.types";
import { EventDetail, EventManager, EventType } from "./event-manager";
import { CameraState, PermissionResponse, PermissionStatus } from "../types/camera.types";

export class CameraManager {
    private readonly events = new EventManager();
    private readonly state$ = new BehaviorSubject<CameraState>({
        devices: [],
        activeDevice: undefined,
        userPreferredDevice: undefined,
        stream: undefined,
        isStreaming: false,
        hasPermission: false,
        permissionDenied: false,
        hasMultipleDevices: false,
        error: undefined,
        isRecording: false,
        recordedChunks: [],
        lastCapturedImage: undefined,
        frameRate: undefined,
        latency: undefined,
        isMirrored: false,
        isFullscreen: false,
        supportsTorch: false,
        supportsFocus: false,
        supportsZoom: false
    });



    // ==========================================================
    // State Management
    // ==========================================================

    public get state(): CameraState {
        return this.state$.getValue();
    }

    /**
     * Update camera state.
     * @param newState The new state to update.
     */
    private updateState(newState: Partial<CameraState>) {
        Object.assign(this.state$.getValue(), newState);
        this.state$.next(this.state$.getValue());
    }

    /**
     * Listen for state changes.
     * @returns Observable for camera state.
     */
    public onStateChange(): Observable<CameraState> {
        return this.state$.asObservable();
    }

    //#region Event Management
    private setupChangeListeners(): void {
        // 1. Handle Device Changes
        navigator.mediaDevices.addEventListener('devicechange', async () => {
            // todo: handle device changes
            // await this.refreshDeviceList();
        });

        // 2. Handle Visibility Change
        document.addEventListener('visibilitychange', () => {
            // this.handleVisibilityChange();
        });

        // 3. Handle Orientation Change
        window.addEventListener('orientationchange', () => {
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
    async getPermissionsAsync(): Promise<PermissionResponse> {
        return await this.handlePermissionsQueryAsync('camera');
    };

    async handlePermissionsQueryAsync(
        query: 'camera' | 'microphone'
    ): Promise<PermissionResponse> {
        if (!navigator?.permissions?.query) {
            throw new CameraError(
                'no-device',
                'MediaDevices API not supported in this browser'
            );
        }

        try {
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


    //#endregion


    //#region Device Management

    /**
    * Check if the browser supports media devices
    */
    private checkMediaDevicesSupport(): boolean {
        if (!navigator?.mediaDevices?.enumerateDevices) {
            throw new CameraError(
                'no-device',
                'MediaDevices API not supported in this browser'
            );
        }
        return true;
    }

    /**
     * Get list of available camera devices
     */
    public async getAvailableCameraDevices(): Promise<MediaDeviceInfo[]> {
        // Return cached devices if available
        if (this.state.devices.length > 0) {
            return this.state.devices;
        }

        try {
            // Check browser support
            this.checkMediaDevicesSupport();

            // Request permission if needed
            await navigator.mediaDevices.getUserMedia({ video: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                throw new CameraError(
                    'no-device',
                    'No video input devices found'
                );
            }

            this.updateState({
                devices: videoDevices,
                hasMultipleDevices: videoDevices.length > 1
            });

            return this.state.devices;
        } catch (error) {
            this.handleError(error);
            return [];
        }
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
