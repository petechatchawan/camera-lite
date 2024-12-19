export class EventManager {
    constructor() {
        this.listeners = new Map();
    }
    emit(event, detail) {
        var _a;
        (_a = this.listeners.get(event)) === null || _a === void 0 ? void 0 : _a.forEach(callback => callback(detail));
    }
    // Event Handling
    on(event, callback) {
        var _a;
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        (_a = this.listeners.get(event)) === null || _a === void 0 ? void 0 : _a.add(callback);
    }
    off(event, callback) {
        var _a;
        (_a = this.listeners.get(event)) === null || _a === void 0 ? void 0 : _a.delete(callback);
    }
    clear() {
        this.listeners.clear();
    }
}
