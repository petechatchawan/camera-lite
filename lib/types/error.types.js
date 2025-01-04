export class CameraError extends Error {
    constructor(code, message, originalError) {
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
    toString() {
        const baseError = `[${this.code}] ${this.message}`;
        return this.originalError ? `${baseError}\nCaused by: ${this.originalError.message}` : baseError;
    }
    /**
     * Converts the error to a JSON object for logging or debugging.
     * @returns A JSON representation of the error.
     */
    toJSON() {
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
