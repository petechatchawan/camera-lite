var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BehaviorSubject } from 'rxjs';
import { PermissionStatus, } from '../types/camera.types';
import { CameraError } from '../types/error.types';
// Default State Factory
export function getInitialCameraState() {
    return {
        // Device Information
        devices: [],
        hasMultipleDevices: false,
        activeDevice: undefined,
        cameraType: 'front',
        // Stream and Activity State
        activeStream: undefined,
        isActive: false,
        isInitializing: false,
        // Settings and Capabilities
        capabilities: undefined,
        currentSettings: undefined,
        enableAudio: false,
        targetResolution: undefined,
        fallbackResolution: undefined,
        enableAutoRotation: false,
        // Elements
        previewElement: null,
        captureElement: null,
        // Features Support
        supportsTorch: false,
        supportsFocus: false,
        supportsZoom: false,
        supportsRecording: false,
        // UI State
        // isMirrored: false,
        isTorchEnabled: false,
        // Results
        lastCapturedImage: undefined,
        // Error Handling
        error: undefined,
    };
}
export class CameraLite {
    constructor() {
        this.state = new BehaviorSubject(getInitialCameraState());
        console.log('[CameraLite] Constructing...');
        this.checkOrientation();
    }
    checkOrientation() {
        console.log('[CameraLite] Checking orientation...');
        if (screen.orientation) {
            console.log('Screen orientation is supported');
            const orientation = screen.orientation.type;
            const angle = screen.orientation.angle;
            console.log(`Orientation type: ${orientation}, angle: ${angle}`);
            switch (orientation) {
                case 'portrait-primary':
                    console.log('Portrait (ปกติ)');
                    break;
                case 'portrait-secondary':
                    console.log('Portrait (กลับหัว)');
                    break;
                case 'landscape-primary':
                    console.log('Landscape (ปกติ)');
                    break;
                case 'landscape-secondary':
                    console.log('Landscape (กลับด้าน)');
                    break;
                default:
                    console.log('Unknown orientation');
            }
        }
        else {
            console.log('screen.orientation is not supported');
        }
    }
    //#region State Management
    // Methods for updating state
    updateCameraState(newState) {
        const updatedState = Object.assign(Object.assign({}, this.cameraState), newState);
        if (this.cameraState.onStateChange) {
            this.cameraState.onStateChange(updatedState);
        }
        Object.assign(this.cameraState, updatedState);
    }
    get cameraState() {
        return this.state.getValue();
    }
    // Reset state
    resetCameraState() {
        this.state.next(getInitialCameraState());
    }
    getCameraState() {
        return this.cameraState;
    }
    getActiveDevice() {
        return this.cameraState.activeDevice || undefined;
    }
    getActiveResolution() {
        return this.cameraState.activeResolution || undefined;
    }
    getCanvasElement() {
        return this.cameraState.captureElement || undefined;
    }
    isCameraActive() {
        return this.cameraState.isActive;
    }
    isCameraInitializing() {
        return this.cameraState.isInitializing;
    }
    clearError() {
        this.updateCameraState({ error: undefined });
    }
    //#region Event Management
    setupChangeListeners() {
        navigator.mediaDevices.addEventListener('devicechange', () => __awaiter(this, void 0, void 0, function* () {
            // ? Handle Device Changes
            yield this.updateDeviceList();
        }));
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
    checkPermissionsSupport() {
        var _a;
        if (!((_a = navigator === null || navigator === void 0 ? void 0 : navigator.permissions) === null || _a === void 0 ? void 0 : _a.query)) {
            throw new CameraError('no-permissions-api', 'MediaDevices API not supported in this browser');
        }
        return true;
    }
    getCameraPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.handlePermissionsQuery('camera');
        });
    }
    getMicrophonePermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.handlePermissionsQuery('microphone');
        });
    }
    handlePermissionsQuery(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check Permissions API support
                this.checkPermissionsSupport();
                // Request permission
                const { state } = yield navigator.permissions.query({
                    name: query,
                });
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
    requestCameraPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield this.requestUserMedia({ video: true });
                stream.getTracks().forEach((track) => track.stop());
                return {
                    status: PermissionStatus.GRANTED,
                    granted: true,
                };
            }
            catch (error) {
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
        });
    }
    //#endregion
    //#region Device Management
    /**
     * Check if the browser supports media devices
     */
    checkMediaDevicesSupport() {
        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.enumerateDevices ||
            !navigator.mediaDevices.getUserMedia) {
            throw new CameraError('no-media-devices-support', 'The browser does not support the MediaDevices API');
        }
        return true;
    }
    /**
     * Get list of available camera devices
     */
    getDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cameraState.devices.length > 0) {
                return this.cameraState.devices;
            }
            try {
                yield this.updateDeviceList();
                if (this.cameraState.devices.length === 0) {
                    throw new CameraError('no-device', 'No video input devices found');
                }
                return this.cameraState.devices;
            }
            catch (error) {
                this.handleError(error);
                return [];
            }
        });
    }
    updateDeviceList() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check browser support
            this.checkMediaDevicesSupport();
            // Enumerate available devices and update device list
            const updatedDevices = yield navigator.mediaDevices.enumerateDevices();
            const videoDevices = updatedDevices.filter((device) => device.kind === 'videoinput');
            this.updateCameraState({
                devices: videoDevices,
                hasMultipleDevices: this.cameraState.devices.length > 1,
            });
        });
    }
    /**
     * Returns the next available camera
     */
    findNextDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const devices = yield this.getDevices();
            if (devices.length <= 1) {
                return null;
            }
            const selectedDevice = this.cameraState.activeDevice;
            const currentIndex = devices.findIndex((d) => d.deviceId === (selectedDevice === null || selectedDevice === void 0 ? void 0 : selectedDevice.deviceId));
            return devices[(currentIndex + 1) % devices.length];
        });
    }
    //#endregion
    //#region Stream Management
    requestUserMedia(constraints) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield navigator.mediaDevices.getUserMedia(constraints);
            }
            catch (error) {
                throw error;
            }
        });
    }
    startStream() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // update state before starting
                this.updateCameraState({
                    isInitializing: true,
                    isActive: false,
                    error: undefined,
                });
                // stop old stream
                yield this.stopStream();
                // Start camera
                const useFallbackMode = this.cameraState.fallbackResolution ? true : false;
                const constraints = this.createMediaStreamConstraints(useFallbackMode);
                const stream = yield this.requestUserMedia(constraints);
                if (!stream) {
                    throw new CameraError('no-stream', 'Failed to start camera');
                }
                // ? set preview
                yield this.setPreviewStream(stream);
                // ? update stream configuration
                this.updateStreamSettings(stream);
                // Update capabilities
                yield this.updateCapabilities();
                // ? update mirror effect
                this.applyMirrorEffect();
                // todo: update state after starting
                // update state after starting
                this.updateCameraState({ isActive: true });
                // ? call onStarted
                if (this.cameraState.onCameraStart) {
                    this.cameraState.onCameraStart();
                }
            }
            catch (error) {
                // update state after error
                this.updateCameraState({ isActive: false });
                throw new CameraError('camera-start-error', 'Failed to start camera', error instanceof Error ? error : undefined);
            }
            finally {
                this.updateCameraState({ isInitializing: false });
            }
        });
    }
    createMediaStreamConstraints(fallbackMode = false) {
        var _a, _b, _c, _d, _e;
        const resolution = fallbackMode
            ? (_a = this.cameraState.fallbackResolution) !== null && _a !== void 0 ? _a : {
                width: 1280,
                height: 720,
                name: '720p',
            }
            : (_b = this.cameraState.targetResolution) !== null && _b !== void 0 ? _b : {
                width: 1280,
                height: 720,
                name: '720p',
            };
        const autoSwapResolution = (_c = this.cameraState.enableAutoRotation) !== null && _c !== void 0 ? _c : false;
        const finalResolution = this.getFinalResolution(resolution, autoSwapResolution);
        const videoConstraints = {
            deviceId: ((_d = this.cameraState.selectedDevice) === null || _d === void 0 ? void 0 : _d.deviceId)
                ? { exact: this.cameraState.selectedDevice.deviceId }
                : undefined,
            facingMode: ((_e = this.cameraState.selectedDevice) === null || _e === void 0 ? void 0 : _e.deviceId) ? undefined : this.cameraState.cameraType,
            width: { exact: finalResolution.width },
            height: { exact: finalResolution.height },
        };
        if (videoConstraints.facingMode === undefined) {
            delete videoConstraints.facingMode;
        }
        return {
            audio: this.cameraState.enableAudio,
            video: videoConstraints,
        };
    }
    getFinalResolution(resolution, autoSwapResolution) {
        const isMobile = navigator.maxTouchPoints > 3;
        if (autoSwapResolution && isMobile) {
            return {
                width: resolution.height,
                height: resolution.width,
                name: resolution.name,
            };
        }
        return resolution;
    }
    setPreviewStream(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cameraState.previewElement && stream) {
                this.cameraState.previewElement.srcObject = stream;
                yield new Promise((resolve) => {
                    if (!this.cameraState.previewElement) {
                        return resolve(false);
                    }
                    this.cameraState.previewElement.onloadedmetadata = () => {
                        resolve(true);
                    };
                });
            }
        });
    }
    updateStreamSettings(stream) {
        var _a, _b;
        if (stream === null) {
            console.warn('updateStreamSettings: stream is null');
            return;
        }
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getSettings();
        const { width = 0, height = 0, deviceId, facingMode } = capabilities;
        const selectedCamera = this.cameraState.devices.find((camera) => camera.deviceId === deviceId);
        if (!selectedCamera) {
            console.warn('Selected camera not found in available devices');
        }
        const requestedResolution = (_a = this.cameraState.targetResolution) !== null && _a !== void 0 ? _a : null;
        const autoSwapResolution = (_b = this.cameraState.enableAutoRotation) !== null && _b !== void 0 ? _b : false;
        const shouldSwapDimensions = requestedResolution !== null &&
            this.shouldSwapDimensions(requestedResolution, { width, height }, autoSwapResolution !== null && autoSwapResolution !== void 0 ? autoSwapResolution : false);
        const actualResolution = {
            width: shouldSwapDimensions ? height : width,
            height: shouldSwapDimensions ? width : height,
            name: (requestedResolution === null || requestedResolution === void 0 ? void 0 : requestedResolution.name) || 'unknown',
        };
        if (requestedResolution &&
            (requestedResolution.width !== actualResolution.width ||
                requestedResolution.height !== actualResolution.height)) {
            console.warn(`Requested resolution (${requestedResolution.width}x${requestedResolution.height}) ` +
                `differs from actual resolution (${actualResolution.width}x${actualResolution.height})` +
                (shouldSwapDimensions ? ' (dimensions were swapped)' : ''));
        }
        const updatedConfig = {
            targetResolution: actualResolution,
            selectedDevice: selectedCamera !== null && selectedCamera !== void 0 ? selectedCamera : undefined,
            cameraType: facingMode || this.cameraState.cameraType,
        };
        this.updateCameraState(Object.assign({ activeStream: stream, isActive: true, activeDevice: selectedCamera, activeResolution: actualResolution }, updatedConfig));
    }
    shouldSwapDimensions(requested, actual, autoSwapEnabled) {
        if (!requested || !autoSwapEnabled) {
            return false;
        }
        const currentAspectRatio = actual.width / actual.height;
        const requestedAspectRatio = requested.width / requested.height;
        if (Math.abs(currentAspectRatio - requestedAspectRatio) > 0.01) {
            const swappedWidth = actual.height;
            const swappedHeight = actual.width;
            return ((swappedWidth === requested.width && swappedHeight === requested.height) ||
                Math.abs(swappedWidth / swappedHeight - requestedAspectRatio) <
                    Math.abs(currentAspectRatio - requestedAspectRatio));
        }
        return false;
    }
    applyMirrorEffect() {
        if (this.cameraState.previewElement) {
            this.cameraState.previewElement.style.transform = this.cameraState.enableMirroring
                ? 'scaleX(-1)'
                : 'scaleX(1)';
        }
    }
    stopStream() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.cameraState.activeStream) {
                    this.cameraState.activeStream.getTracks().forEach((track) => track.stop());
                    this.updateCameraState({ activeStream: undefined });
                    if (this.cameraState.onCameraStop) {
                        this.cameraState.onCameraStop();
                    }
                }
                if (this.cameraState.previewElement) {
                    this.cameraState.previewElement.srcObject = null;
                }
            }
            catch (error) {
                console.error('Error destroying camera:', error);
                this.handleError(new CameraError('camera-stop-error', 'Failed to stop camera', error instanceof Error ? error : undefined));
            }
        });
    }
    updateSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.cameraState.activeStream) {
                    throw new CameraError('no-stream', 'No stream to update settings on');
                }
                const videoTrack = this.cameraState.activeStream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities();
                const newSettings = {};
                // Update zoom if supported
                // if (settings.zoom !== undefined && capabilities.zoom) {
                //     newSettings.zoom = settings.zoom;
                // }
                // Update focus if supported
                // if (settings.focus?.mode && capabilities.focusMode) {
                //     newSettings.focusMode = settings.focus.mode;
                // }
                yield videoTrack.applyConstraints({ advanced: [newSettings] });
                // Update state
                this.updateCameraState({
                    currentSettings: Object.assign(Object.assign({}, this.cameraState.currentSettings), settings),
                });
                // todo: callback
                // this.emitEvent('onSettingsChange', { status: 'success' });
            }
            catch (error) {
                this.handleError(new CameraError('camera-settings-error', 'Failed to update camera settings', error instanceof Error ? error : undefined));
            }
        });
    }
    /**
     * Apply camera configuration changes
     */
    applyConfigurationChanges(newConfig, forceRestart = false) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            // ตรวจสอบค่า newConfig
            if (!newConfig) {
                throw new Error('No configuration provided');
            }
            // เก็บค่า this.cameraState ในตัวแปรชั่วคราว
            const prevConfig = this.cameraState;
            // ตรวจสอบการเปลี่ยนแปลง
            const isDeviceChanged = ((_a = newConfig.selectedDevice) === null || _a === void 0 ? void 0 : _a.deviceId) !== ((_b = prevConfig.selectedDevice) === null || _b === void 0 ? void 0 : _b.deviceId);
            const isFacingModeChanged = newConfig.cameraType !== prevConfig.cameraType;
            const isResolutionChanged = newConfig.targetResolution &&
                (newConfig.targetResolution.width !== ((_c = prevConfig.targetResolution) === null || _c === void 0 ? void 0 : _c.width) ||
                    newConfig.targetResolution.height !== ((_d = prevConfig.targetResolution) === null || _d === void 0 ? void 0 : _d.height));
            // อัปเดตค่า config
            const updatedConfig = Object.assign(Object.assign({}, prevConfig), newConfig);
            // อัปเดต state
            this.updateCameraState(updatedConfig);
            // ตรวจสอบว่า activeStream และ previewElement มีค่าหรือไม่
            if (!this.cameraState.activeStream || !this.cameraState.previewElement) {
                yield this.startStream();
                return;
            }
            // ตรวจสอบเงื่อนไขสำหรับการเริ่มสตรีมใหม่
            if (isDeviceChanged || isFacingModeChanged || isResolutionChanged || forceRestart) {
                yield this.startStream();
                return;
            }
            // ตรวจสอบ video track
            const track = this.cameraState.activeStream.getVideoTracks()[0];
            if (!track) {
                throw new Error('No video track found');
            }
            // ตรวจสอบการเปลี่ยนแปลง settings
            const currentSettings = track.getSettings();
            const newConstraints = this.createMediaStreamConstraints();
            const needsUpdate = this.hasSettingsChanged(currentSettings, newConstraints.video);
            // อัปเดต constraints หากจำเป็น
            if (needsUpdate) {
                try {
                    yield track.applyConstraints(newConstraints.video);
                }
                catch (error) {
                    // ย้อนกลับการเปลี่ยนแปลงหากเกิดข้อผิดพลาด
                    this.updateCameraState(prevConfig);
                    throw error;
                }
            }
            // ตรวจสอบการเปลี่ยนแปลง enableMirroring
            if (this.cameraState.enableMirroring !== prevConfig.enableMirroring) {
                this.applyMirrorEffect();
            }
        });
    }
    hasSettingsChanged(currentSettings, newConstraints) {
        const significantChanges = [
            this.isConstraintChanged(currentSettings.width, newConstraints.width),
            this.isConstraintChanged(currentSettings.height, newConstraints.height),
            this.isConstraintChanged(currentSettings.facingMode, newConstraints.facingMode),
            this.isConstraintChanged(currentSettings.aspectRatio, newConstraints.aspectRatio),
        ];
        return significantChanges.some((changed) => changed);
    }
    isConstraintChanged(currentValue, newConstraint) {
        if (!newConstraint)
            return false;
        if (typeof newConstraint === 'object') {
            const constraintValue = newConstraint.ideal || newConstraint.exact;
            return currentValue !== constraintValue;
        }
        return currentValue !== newConstraint;
    }
    //#endregion
    //#region Camera Capabilities
    initializeCameraCapabilities() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get available devices
                const devices = yield this.getDevices();
                // Analyze each device
                const capabilities = yield Promise.all(devices.map((device) => this.analyzeCameraDevice(device)));
                // Filter out null values
                return capabilities.filter(Boolean);
            }
            catch (error) {
                console.error('Failed to initialize camera capabilities:', error);
                throw error;
            }
        });
    }
    analyzeCameraDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: device.deviceId },
                        width: { ideal: 4096 },
                        height: { ideal: 2160 },
                    },
                });
                const track = stream.getVideoTracks()[0];
                const settings = track.getSettings();
                // ทำความสะอาด stream ทันที
                stream.getTracks().forEach((track) => track.stop());
                return {
                    deviceId: device.deviceId,
                    label: device.label,
                    maxWidth: settings.width || 0,
                    maxHeight: settings.height || 0,
                };
            }
            catch (error) {
                console.warn(`Could not analyze device ${device.label}:`, error);
                return null;
            }
        });
    }
    // ตรวจสอบ resolution จากข้อมูล MaxResolution โดยไม่ต้องเปิดกล้อง
    isResolutionSupportedFromSpecs(maxResolution, width, height) {
        return width <= maxResolution.maxWidth && height <= maxResolution.maxHeight;
    }
    // ตรวจสอบ resolutions ทั้งหมดจากข้อมูล MaxResolution
    checkSupportedResolutionsFromSpecs(maxResolution, resolutions = CameraLite.STANDARD_RESOLUTIONS) {
        return resolutions.map((resolution) => (Object.assign(Object.assign({}, resolution), { isSupported: this.isResolutionSupportedFromSpecs(maxResolution, resolution.width, resolution.height) })));
    }
    /**
     * Toggles the torch (flashlight) on the active video stream.
     *
     * @param enable - A boolean indicating whether to enable (true) or disable (false) the torch.
     * @throws Will throw an error if the video stream is not initialized or no video track is found.
     * @throws Will log a warning if the torch capability is not supported on the device.
     * @throws Will handle an error if applying the torch constraint fails.
     */
    enableTorch(enable) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.cameraState.activeStream) {
                    throw new Error('Stream is not initialized');
                }
                const videoTrack = this.cameraState.activeStream.getVideoTracks()[0];
                if (!videoTrack) {
                    throw new Error('No video track found');
                }
                const capabilities = videoTrack.getCapabilities();
                if (!('torch' in capabilities)) {
                    console.warn('Torch capability is not supported on this device');
                    throw new Error('Torch capability is not supported on this device');
                }
                yield videoTrack.applyConstraints({
                    advanced: [{ torch: enable }],
                });
                this.updateCameraState({ isTorchEnabled: enable });
            }
            catch (error) {
                console.error(`Failed to ${enable ? 'enable' : 'disable'} torch:`, error);
                console.log('Error:', error instanceof CameraError);
                this.handleError(error instanceof CameraError ? error : new CameraError('torch-error', `${error}`, error));
            }
        });
    }
    /**
     * Sets the focus mode on the active video stream.
     *
     * @param stream - The active video stream.
     * @param focusMode - The focus mode to set. Can be 'continuous', 'manual', or 'single-shot'.
     * @throws Will do nothing if the video stream is not initialized or no video track is found.
     * @throws Will log a warning if the focus mode capability is not supported on the device.
     * @throws Will handle an error if applying the focus mode constraint fails.
     */
    setFocusMode(stream, focusMode) {
        return __awaiter(this, void 0, void 0, function* () {
            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!('focusMode' in capabilities) || !capabilities.focusMode.includes(focusMode)) {
                throw new CameraError('focus-error', `Focus mode '${focusMode}' is not supported on this device.}`);
            }
            try {
                yield videoTrack.applyConstraints({
                    advanced: [{ focusMode }],
                });
            }
            catch (error) {
                this.handleError(error instanceof CameraError
                    ? error
                    : new CameraError('focus-error', `Failed to set focus mode: ${error}`, error));
            }
        });
    }
    //#endregion
    //#region Camera Control
    /**
     * Initializes the camera with the provided configuration.
     * @param config - The configuration for the camera.
     * @throws {CameraError} If initialization fails.
     */
    initialize(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Initializing camera with:', config);
                // Update configuration
                this.updateCameraState(config);
                // Check browser support
                this.checkMediaDevicesSupport();
                // Get available devices
                yield this.updateDeviceList();
                console.log('Available devices:', this.cameraState.devices);
                // Start stream with initial configuration
                yield this.startStream();
            }
            catch (error) {
                // แยกการตรวจสอบ error type ให้ชัดเจน
                const baseError = error instanceof CameraError
                    ? error
                    : error instanceof Error
                        ? new CameraError('unknown', `${error.message}`, error)
                        : new CameraError('unknown', 'An unknown error occurred');
                // ตรวจสอบ originalError ให้แน่ใจว่ามีอยู่จริง
                const cameraError = 'originalError' in baseError
                    ? this.analyzeCameraError(baseError.originalError)
                    : this.analyzeCameraError(baseError);
                // อัพเดท state และ handle error
                this.updateCameraState({ error: cameraError });
                this.handleError(cameraError);
            }
        });
    }
    /**
     * Switches to the next available camera
     */
    switchCamera() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const nextDevice = yield this.findNextDevice();
                if (nextDevice) {
                    yield this.applyConfigurationChanges({ selectedDevice: nextDevice }, true);
                }
                else {
                    throw new CameraError('no-device', 'No device found');
                }
            }
            catch (error) {
                // แยกการตรวจสอบ error type ให้ชัดเจน
                const baseError = error instanceof CameraError
                    ? error
                    : error instanceof Error
                        ? new CameraError('unknown', `${error.message}`, error)
                        : new CameraError('unknown', 'An unknown error occurred');
                // ตรวจสอบ originalError ให้แน่ใจว่ามีอยู่จริง
                const cameraError = 'originalError' in baseError
                    ? this.analyzeCameraError(baseError.originalError)
                    : this.analyzeCameraError(baseError);
                // อัพเดท state และ handle error
                this.updateCameraState({ error: cameraError });
                this.handleError(cameraError);
            }
        });
    }
    analyzeCameraError(error) {
        if (error instanceof Error) {
            // NotReadableError หรือ TrackStartError มักเกิดเมื่อกล้องถูกใช้งานโดยแอพอื่น
            if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                return new CameraError('camera-already-in-use', 'Camera is currently in use by another application', error);
            }
            // NotFoundError เกิดเมื่อไม่พบกล้อง
            if (error.name === 'NotFoundError') {
                return new CameraError('no-device', 'No camera device was found', error);
            }
            // NotAllowedError หรือ PermissionDeniedError เกิดเมื่อผู้ใช้ปฏิเสธการขอใช้กล้อง
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                return new CameraError('permission-denied', 'Camera access permission was denied', error);
            }
            // ConstraintNotSatisfiedError เกิดเมื่อไม่สามารถใช้งานตาม constraints ที่กำหนด
            if (error.name === 'ConstraintNotSatisfiedError') {
                return new CameraError('configuration-error', 'Camera could not satisfy the requested constraints', error);
            }
            // OverconstrainedError เกิดเมื่อ constraints ที่กำหนดไม่สามารถใช้งานได้
            if (error.name === 'OverconstrainedError') {
                return new CameraError('configuration-error', 'The requested constraints cannot be satisfied', error);
            }
            // AbortError เกิดเมื่อกระบวนการถูกยกเลิก
            if (error.name === 'AbortError') {
                return new CameraError('unknown', 'The operation was aborted', error);
            }
            // TypeError เกิดเมื่อมีข้อผิดพลาดในการใช้งาน API
            if (error.name === 'TypeError') {
                return new CameraError('unknown', 'An invalid argument was provided', error);
            }
        }
        // กรณีอื่นๆ
        return new CameraError('unknown', 'An unknown error occurred', error);
    }
    updateCapabilities() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Updating camera capabilities...');
            if (!this.cameraState.activeStream) {
                console.log('No stream available. Cannot update capabilities.');
                return;
            }
            const videoTrack = this.cameraState.activeStream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            console.log('Capabilities:', capabilities);
            // check if capabilities are available
            this.updateCameraState({
                enableAudio: (_b = (_a = capabilities.facingMode) === null || _a === void 0 ? void 0 : _a.includes('user')) !== null && _b !== void 0 ? _b : false,
                supportsTorch: 'torch' in capabilities,
                supportsFocus: 'focusMode' in capabilities,
                supportsZoom: 'zoom' in capabilities,
            });
            console.log('Updated capabilities:', this.cameraState);
        });
    }
    toggleMirroring() {
        this.cameraState.enableMirroring = !this.cameraState.enableMirroring;
        this.applyMirrorEffect();
    }
    /**
     * Cleans up camera resources by stopping the stream, clearing events, and resetting the configuration.
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stopStream();
            this.resetCameraState();
            this.removeEventListeners();
        });
    }
    removeEventListeners() {
        navigator.mediaDevices.removeEventListener('devicechange', this.updateDeviceList);
        // document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        // window.removeEventListener('orientationchange', this.handleOrientationChange);
    }
    //#endregion
    /**
     * Takes a photo from the camera stream.
     *
     * @param options - Capture options.
     * @returns A promise that resolves with a `CameraCapturedResult` object if the photo is taken successfully,
     *          or `null` if an error occurs.
     */
    takePhoto(options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.cameraState.activeStream) {
                throw new CameraError('no-stream', 'Camera is not started');
            }
            const previewElement = this.cameraState.previewElement;
            const captureElement = this.cameraState.captureElement;
            if (!previewElement || !captureElement) {
                throw new CameraError('configuration-error', 'Camera is not properly configured');
            }
            try {
                const { videoWidth, videoHeight } = previewElement;
                const { width, height } = this.calculateScaledSize(videoWidth, videoHeight, (_a = options.scale) !== null && _a !== void 0 ? _a : 1);
                captureElement.width = width;
                captureElement.height = height;
                const context = captureElement.getContext('2d');
                if (!context) {
                    throw new CameraError('canvas-error', 'Unable to get canvas context');
                }
                if (options.mirror) {
                    context.setTransform(-1, 0, 0, 1, width, 0);
                }
                context.drawImage(previewElement, 0, 0, width, height);
                const dataUrl = captureElement.toDataURL(options.imageType || 'image/jpeg', (_b = options.quality) !== null && _b !== void 0 ? _b : 1.0);
                return {
                    width,
                    height,
                    uri: dataUrl,
                    timestamp: new Date().toISOString(),
                    base64: dataUrl.split(',')[1],
                };
            }
            catch (error) {
                throw new CameraError('camera-take-photo-error', 'Failed to take photo', error instanceof Error ? error : new Error(`${error}`));
            }
        });
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
    calculateScaledSize(videoWidth, videoHeight, scale) {
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
    handleError(error) {
        const cameraError = error instanceof CameraError
            ? error
            : new CameraError('unknown', error instanceof Error ? error.message : 'An unknown error occurred', error instanceof Error ? error : undefined);
        // เรียก Callback หากถูกกำหนด
        if (this.cameraState.onError) {
            this.cameraState.onError({
                status: 'error',
                error: cameraError,
            });
        }
        console.error('[Camera Error]:', cameraError.toString());
    }
    /**
     * Checks if the error is an OverconstrainedError
     * @param error The error to check
     * @returns Whether the error is an OverconstrainedError
     */
    isOverconstrainedError(error) {
        return error instanceof Error && error.name === 'OverconstrainedError';
    }
    /**
     * Checks if the error is related to the camera being in use.
     *
     * @param error - The error to check. Can be an Error object or undefined.
     * @returns A boolean indicating whether the error is a camera in-use error, specifically 'NotReadableError' or 'AbortError'.
     */
    isCameraInUseError(error) {
        return error instanceof Error && (error.name === 'NotReadableError' || error.name === 'AbortError');
    }
}
CameraLite.STANDARD_RESOLUTIONS = [
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
    { width: 1152, height: 2048, name: '2K Portrait' },
];
