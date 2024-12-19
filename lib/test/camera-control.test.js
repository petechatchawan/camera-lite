var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CameraManager } from '../main/camera-control';
describe('CameraManager', () => {
    let cameraManager;
    beforeAll(() => {
        global.navigator = {
            permissions: {
                query: jest.fn()
            },
            mediaDevices: {
                getUserMedia: jest.fn(),
                enumerateDevices: jest.fn()
            }
        };
    });
    beforeEach(() => {
        jest.clearAllMocks();
        cameraManager = new CameraManager();
    });
    describe('State Management', () => {
        it('should initialize with default state', () => {
            expect(cameraManager.state).toEqual({
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
        });
    });
    describe('Device Management', () => {
        const mockDevices = [
            { kind: 'videoinput', deviceId: '1' },
            { kind: 'videoinput', deviceId: '2' }
        ];
        it('should get available camera devices', () => __awaiter(void 0, void 0, void 0, function* () {
            navigator.mediaDevices.enumerateDevices.mockResolvedValueOnce(mockDevices);
            navigator.mediaDevices.getUserMedia.mockResolvedValueOnce({});
            const devices = yield cameraManager.getAvailableCameraDevices();
            expect(devices).toEqual(mockDevices);
            expect(cameraManager.state.hasMultipleDevices).toBe(true);
        }));
        it('should handle no devices found', () => __awaiter(void 0, void 0, void 0, function* () {
            navigator.mediaDevices.enumerateDevices.mockResolvedValueOnce([]);
            navigator.mediaDevices.getUserMedia.mockResolvedValueOnce({});
            const devices = yield cameraManager.getAvailableCameraDevices();
            expect(devices).toEqual([]);
            expect(cameraManager.state.hasMultipleDevices).toBe(false);
        }));
        it('should handle enumeration error', () => __awaiter(void 0, void 0, void 0, function* () {
            const error = new Error('Enumeration failed');
            navigator.mediaDevices.enumerateDevices.mockRejectedValueOnce(error);
            const devices = yield cameraManager.getAvailableCameraDevices();
            expect(devices).toEqual([]);
            expect(cameraManager.state.error).toBeUndefined();
        }));
    });
    describe('Event Management', () => {
        it('should handle event subscription and emission', () => {
            const mockCallback = jest.fn();
            const eventDetail = { status: 'success' };
            cameraManager.onEvent('start', mockCallback);
            cameraManager.emitEvent('start', eventDetail);
            expect(mockCallback).toHaveBeenCalledWith(eventDetail);
        });
        it('should handle event unsubscription', () => {
            const mockCallback = jest.fn();
            cameraManager.onEvent('ready', mockCallback);
            cameraManager.offEvent('ready', mockCallback);
            cameraManager.emitEvent('ready', { status: 'success' });
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });
});
