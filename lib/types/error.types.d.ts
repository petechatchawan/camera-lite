export type CameraErrorCode = 'configuration-error' | 'no-device' | 'camera-already-in-use' | 'unknown';
export declare class CameraError<T extends CameraErrorCode> extends Error {
    private readonly _code;
    private readonly _message;
    private readonly _originalError?;
    get code(): T;
    get message(): string;
    get originalError(): Error | undefined;
    constructor(code: T, message: string, originalError?: Error);
    toString(): string;
}
