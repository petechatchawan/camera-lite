var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BehaviorSubject } from "rxjs";
import { CameraError } from "../types/error.types";
import { EventManager } from "./event-manager";
import { PermissionStatus } from "../types/camera.types";
export class CameraManager {
    constructor() {
        this.events = new EventManager();
        this.state$ = new BehaviorSubject({
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
        //#endregion
    }
    // ==========================================================
    // State Management
    // ==========================================================
    get state() {
        return this.state$.getValue();
    }
    /**
     * Update camera state.
     * @param newState The new state to update.
     */
    updateState(newState) {
        Object.assign(this.state$.getValue(), newState);
        this.state$.next(this.state$.getValue());
    }
    /**
     * Listen for state changes.
     * @returns Observable for camera state.
     */
    onStateChange() {
        return this.state$.asObservable();
    }
    //#region Event Management
    setupChangeListeners() {
        // 1. Handle Device Changes
        navigator.mediaDevices.addEventListener('devicechange', () => __awaiter(this, void 0, void 0, function* () {
            // todo: handle device changes
            // await this.refreshDeviceList();
        }));
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
    onEvent(event, callback) {
        this.events.on(event, callback);
    }
    /**
     * Unsubscribe from a specific event.
     * @param event The type of event.
     * @param callback The callback to remove.
     */
    offEvent(event, callback) {
        this.events.off(event, callback);
    }
    /**
     * Emit an event with details.
     * @param event The type of event.
     * @param detail The event details.
     */
    emitEvent(event, detail) {
        try {
            this.events.emit(event, detail);
        }
        catch (error) {
            console.error(`Error emitting event ${event}`, error);
        }
    }
    //#endregion
    //#region Permission Management
    getPermissionsAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.handlePermissionsQueryAsync('camera');
        });
    }
    ;
    handlePermissionsQueryAsync(query) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = navigator === null || navigator === void 0 ? void 0 : navigator.permissions) === null || _a === void 0 ? void 0 : _a.query)) {
                throw new CameraError('no-device', 'MediaDevices API not supported in this browser');
            }
            try {
                const { state } = yield navigator.permissions.query({ name: query });
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
            }
            catch (e) {
                // Firefox doesn't support querying for the camera permission, so return undetermined status
                if (e instanceof TypeError) {
                    return {
                        status: PermissionStatus.UNDETERMINED,
                        granted: false,
                    };
                }
                throw e;
            }
        });
    }
    //#endregion
    //#region Device Management
    /**
    * Check if the browser supports media devices
    */
    checkMediaDevicesSupport() {
        var _a;
        if (!((_a = navigator === null || navigator === void 0 ? void 0 : navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.enumerateDevices)) {
            throw new CameraError('no-device', 'MediaDevices API not supported in this browser');
        }
        return true;
    }
    /**
     * Get list of available camera devices
     */
    getAvailableCameraDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // Return cached devices if available
            if (this.state.devices.length > 0) {
                return this.state.devices;
            }
            try {
                // Check browser support
                this.checkMediaDevicesSupport();
                // Request permission if needed
                yield navigator.mediaDevices.getUserMedia({ video: true });
                const devices = yield navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                if (videoDevices.length === 0) {
                    throw new CameraError('no-device', 'No video input devices found');
                }
                this.updateState({
                    devices: videoDevices,
                    hasMultipleDevices: videoDevices.length > 1
                });
                return this.state.devices;
            }
            catch (error) {
                this.handleError(error);
                return [];
            }
        });
    }
    //#endregion
    //#region Events (Wrapped to maintain reference equality)
    /**
     * Handle camera errors
     */
    handleError(error) {
        const cameraError = error instanceof CameraError
            ? error
            : new CameraError('unknown', error instanceof Error ? error.message : 'An unknown error occurred', error instanceof Error ? error : undefined);
        this.events.emit('error', {
            status: 'error',
            error: cameraError
        });
        console.error('[Camera Error]:', cameraError.toString());
    }
}
