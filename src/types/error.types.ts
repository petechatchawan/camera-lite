// Camera error codes grouped logically for maintainability
export type CameraErrorCode =
    // Permission-related errors
    | 'no-permissions-api' // Browser does not support the Permissions API
    | 'permission-denied' // User denied camera access
    // Device and configuration errors
    | 'configuration-error' // Camera constraints cannot be satisfied
    | 'no-device' // No camera device found
    | 'no-media-devices-support' // Browser does not support media devices
    // Camera initialization and operation errors
    | 'camera-start-error' // Failed to start the camera
    | 'camera-initialization-error' // Failed to initialize the camera
    | 'no-stream' // No video stream available
    | 'camera-settings-error' // Failed to apply camera settings
    | 'camera-stop-error' // Failed to stop the camera
    | 'camera-already-in-use' // Camera is already in use by another application
    | 'canvas-error' // Failed to access the canvas
    // Camera functionality errors
    | 'camera-take-photo-error' // Failed to take a photo
    | 'torch-error' // Failed to toggle the torch
    | 'focus-error' // Failed to focus the camera
    // Miscellaneous errors
    | 'timeout' // Operation timed out
    | 'unknown'; // Unknown error occurred

export class CameraError<T extends CameraErrorCode> extends Error {
    /** Error code representing the type of error */
    public readonly code: T;
    /** Descriptive message for the error */
    public override readonly message: string;
    /** Optional original error that caused this error */
    public readonly originalError?: Error;

    constructor(code: T, message: string, originalError?: Error) {
        super(message);
        this.code = code;
        this.message = message;
        this.originalError = originalError;
        this.name = 'CameraError';
        Object.setPrototypeOf(this, CameraError.prototype);
    }

    /**
     * Returns a string representation of the CameraError.
     * @returns A detailed string describing the error.
     */
    public override toString(): string {
        const baseError = `[${this.code}] ${this.message}`;
        return this.originalError ? `${baseError}\nCaused by: ${this.originalError.message}` : baseError;
    }

    /**
     * Converts the error to a JSON object for logging or debugging.
     * @returns A JSON representation of the error.
     */
    public toJSON(): object {
        return {
            code: this.code,
            message: this.message,
            originalError: this.originalError
                ? {
                      name: this.originalError.name,
                      message: this.originalError.message,
                      stack: this.originalError.stack,
                  }
                : undefined,
        };
    }
}

export interface CameraEventDetail {
    /** Status of the event ('success' or 'error') */
    status: 'success' | 'error';
    /** Optional data associated with the event */
    data?: any;
    /** Optional error associated with the event */
    error?: CameraError<CameraErrorCode>;
}
