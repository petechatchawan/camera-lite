export class CameraError extends Error {
    get code() {
        return this._code;
    }
    get message() {
        return this._message;
    }
    get originalError() {
        return this._originalError;
    }
    constructor(code, message, originalError) {
        const fullMessage = `[${code}]: ${message}${originalError ? `\nCaused by: ${originalError.message}` : ''}`;
        super(fullMessage);
        this.name = code;
        this._code = code;
        this._message = message;
        this._originalError = originalError;
    }
    toString() {
        return this._originalError
            ? `[${this.code}]: ${this.message} (caused by: ${this._originalError.message})`
            : `[${this.code}]: ${this.message}`;
    }
}
