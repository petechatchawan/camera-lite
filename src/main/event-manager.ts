export type EventType = 'start' | 'stop' | 'error' | 'photo' | 'ready';

export interface EventDetail {
    status: 'success' | 'error';
    data?: any;
    error?: Error;
}

export type EventCallback = (detail: EventDetail) => void;

export class EventManager {
    private listeners = new Map<EventType, Set<(detail: EventDetail) => void>>();

    emit(event: EventType, detail: EventDetail) {
        this.listeners.get(event)?.forEach(callback => callback(detail));
    }

    // Event Handling
    on(event: EventType, callback: EventCallback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);
    }

    off(event: EventType, callback: EventCallback) {
        this.listeners.get(event)?.delete(callback);
    }

    clear() {
        this.listeners.clear();
    }
}
