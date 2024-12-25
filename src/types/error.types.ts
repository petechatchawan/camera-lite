// Error code types with descriptive names and grouping
export type CameraErrorCode =
    | 'no-permissions-api'
    | 'permission-denied'
    | 'configuration-error'
    | 'no-device'
    | 'no-media-devices-support'
    | 'camera-start-error'
    | 'camera-initialization-error'
    | 'no-stream'
    | 'camera-settings-error'
    | 'camera-stop-error'
    | 'camera-already-in-use'
    | 'camera-take-photo-error'
    | 'torch-error'
    | 'focus-error'
    | 'timeout'
    | 'unknown';

export class CameraError<T extends CameraErrorCode> extends Error {
    private readonly _code: T;
    private readonly _message: string;
    private readonly _originalError?: Error;

    get code(): T {
        return this._code;
    }

    override get message(): string {
        return this._message;
    }

    get originalError(): Error | undefined {
        return this._originalError;
    }

    constructor(code: T, message: string, originalError?: Error) {
        const fullMessage = `[${code}]: ${message}${originalError ? `\nCaused by: ${originalError}` : ''}`;
        super(fullMessage);
        this.name = code;
        this._code = code;
        this._message = message;
        this._originalError = originalError;
    }

    public override  toString(): string {
        return this._originalError
            ? `[${this.code}]: ${this.message} (caused by: ${this._originalError})`
            : `[${this.code}]: ${this.message}`;
    }
}
