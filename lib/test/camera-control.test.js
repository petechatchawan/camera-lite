"use strict";
// import { CameraLite } from '../main/camera-lite';
// describe('CameraManager', () => {
//     let cameraLite: CameraLite;
//     beforeAll(() => {
//         global.navigator = {
//             permissions: {
//                 query: jest.fn(),
//             },
//             mediaDevices: {
//                 getUserMedia: jest.fn(),
//                 enumerateDevices: jest.fn(),
//             },
//         } as any;
//     });
//     beforeEach(() => {
//         jest.clearAllMocks();
//         cameraLite = new CameraLite();
//     });
//     describe('State Management', () => {
//         it('should initialize with default state', () => {
//             expect(cameraLite.getCameraState()).toEqual({
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
//                 supportsZoom: false,
//             });
//         });
//     });
//     describe('Device Management', () => {
//         const mockDevices = [
//             { kind: 'videoinput', deviceId: '1' } as MediaDeviceInfo,
//             { kind: 'videoinput', deviceId: '2' } as MediaDeviceInfo,
//         ];
//         it('should get available camera devices', async () => {
//             (navigator.mediaDevices.enumerateDevices as jest.Mock).mockResolvedValueOnce(mockDevices);
//             (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce({});
//             const devices = await cameraLite.getDevices();
//             expect(devices).toEqual(mockDevices);
//             expect(cameraLite.getCameraState().hasMultipleDevices).toBe(true);
//         });
//         it('should handle no devices found', async () => {
//             (navigator.mediaDevices.enumerateDevices as jest.Mock).mockResolvedValueOnce([]);
//             (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce({});
//             const devices = await cameraLite.getDevices();
//             expect(devices).toEqual([]);
//             expect(cameraLite.getCameraState().hasMultipleDevices).toBe(false);
//         });
//         it('should handle enumeration error', async () => {
//             const error = new Error('Enumeration failed');
//             (navigator.mediaDevices.enumerateDevices as jest.Mock).mockRejectedValueOnce(error);
//             const devices = await cameraLite.getDevices();
//             expect(devices).toEqual([]);
//             expect(cameraLite.getCameraState().error).toBeUndefined();
//         });
//     });
// });
