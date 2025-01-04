export type CameraErrorCode = 'no-permissions-api' | 'permission-denied' | 'configuration-error' | 'no-device' | 'no-media-devices-support' | 'camera-start-error' | 'camera-initialization-error' | 'no-stream' | 'camera-settings-error' | 'camera-stop-error' | 'camera-already-in-use' | 'canvas-error' | 'camera-take-photo-error' | 'torch-error' | 'focus-error' | 'timeout' | 'unknown';
export declare class CameraError<T extends CameraErrorCode> extends Error {
    /** Error code representing the type of error */
    readonly code: T;
    /** Descriptive message for the error */
    readonly message: string;
    /** Optional original error that caused this error */
    readonly originalError?: Error;
    constructor(code: T, message: string, originalError?: Error);
    /**
     * Returns a string representation of the CameraError.
     * @returns A detailed string describing the error.
     */
    toString(): string;
    /**
     * Converts the error to a JSON object for logging or debugging.
     * @returns A JSON representation of the error.
     */
    toJSON(): object;
}
export interface CameraEventDetail {
    /** Status of the event ('success' or 'error') */
    status: 'success' | 'error';
    /** Optional data associated with the event */
    data?: any;
    /** Optional error associated with the event */
    error?: CameraError<CameraErrorCode>;
}
