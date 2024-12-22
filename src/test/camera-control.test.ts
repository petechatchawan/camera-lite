// import { CameraManager } from '../main/camera-control';
// import { EventDetail } from '../main/event-manager';
// import { PermissionStatus } from '../types/camera.types';

// describe('CameraManager', () => {
//     let cameraManager: CameraManager;

//     beforeAll(() => {
//         global.navigator = {
//             permissions: {
//                 query: jest.fn()
//             },
//             mediaDevices: {
//                 getUserMedia: jest.fn(),
//                 enumerateDevices: jest.fn()
//             }
//         } as any;
//     });

//     beforeEach(() => {
//         jest.clearAllMocks();
//         cameraManager = new CameraManager();
//     });

//     describe('State Management', () => {
//         it('should initialize with default state', () => {
//             expect(cameraManager.state).toEqual({
//                 devices: [],
//                 activeDevice: undefined,
//                 userPreferredDevice: undefined,
//                 stream: undefined,
//                 isStreaming: false,
//                 hasPermission: false,
//                 permissionDenied: false,
//                 hasMultipleDevices: false,
//                 error: undefined,
//                 isRecording: false,
//                 recordedChunks: [],
//                 lastCapturedImage: undefined,
//                 frameRate: undefined,
//                 latency: undefined,
//                 isMirrored: false,
//                 isFullscreen: false,
//                 supportsTorch: false,
//                 supportsFocus: false,
//                 supportsZoom: false
//             });
//         });
//     });

//     describe('Device Management', () => {
//         const mockDevices = [
//             { kind: 'videoinput', deviceId: '1' } as MediaDeviceInfo,
//             { kind: 'videoinput', deviceId: '2' } as MediaDeviceInfo
//         ];

//         it('should get available camera devices', async () => {
//             (navigator.mediaDevices.enumerateDevices as jest.Mock).mockResolvedValueOnce(mockDevices);
//             (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce({});

//             const devices = await cameraManager.getAvailableCameraDevices();

//             expect(devices).toEqual(mockDevices);
//             expect(cameraManager.state.hasMultipleDevices).toBe(true);
//         });

//         it('should handle no devices found', async () => {
//             (navigator.mediaDevices.enumerateDevices as jest.Mock).mockResolvedValueOnce([]);
//             (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce({});

//             const devices = await cameraManager.getAvailableCameraDevices();

//             expect(devices).toEqual([]);
//             expect(cameraManager.state.hasMultipleDevices).toBe(false);
//         });

//         it('should handle enumeration error', async () => {
//             const error = new Error('Enumeration failed');
//             (navigator.mediaDevices.enumerateDevices as jest.Mock).mockRejectedValueOnce(error);

//             const devices = await cameraManager.getAvailableCameraDevices();

//             expect(devices).toEqual([]);
//             expect(cameraManager.state.error).toBeUndefined();
//         });
//     });

//     describe('Event Management', () => {
//         it('should handle event subscription and emission', () => {
//             const mockCallback = jest.fn();
//             const eventDetail: EventDetail = { status: 'success' };

//             cameraManager.onEvent('start', mockCallback);
//             cameraManager.emitEvent('start', eventDetail);

//             expect(mockCallback).toHaveBeenCalledWith(eventDetail);
//         });

//         it('should handle event unsubscription', () => {
//             const mockCallback = jest.fn();

//             cameraManager.onEvent('ready', mockCallback);
//             cameraManager.offEvent('ready', mockCallback);
//             cameraManager.emitEvent('ready', { status: 'success' });

//             expect(mockCallback).not.toHaveBeenCalled();
//         });
//     });
// });