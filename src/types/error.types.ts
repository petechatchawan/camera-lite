// Error code types with descriptive names and grouping
export type CameraErrorCode =
    | 'configuration-error'
    | 'no-device'
    | 'camera-already-in-use'
    | 'unknown';

export class CameraError<T extends CameraErrorCode> extends Error {
    private readonly _code: T;
    private readonly _message: string;
    private readonly _originalError?: Error;

    get code(): T {
        return this._code;
    }

    get message(): string {
        return this._message;
    }

    get originalError(): Error | undefined {
        return this._originalError;
    }

    constructor(code: T, message: string, originalError?: Error) {
        const fullMessage = `[${code}]: ${message}${originalError ? `\nCaused by: ${originalError.message}` : ''}`;
        super(fullMessage);
        this.name = code;
        this._code = code;
        this._message = message;
        this._originalError = originalError;
    }

    public toString(): string {
        return this._originalError
            ? `[${this.code}]: ${this.message} (caused by: ${this._originalError.message})`
            : `[${this.code}]: ${this.message}`;
    }
}
