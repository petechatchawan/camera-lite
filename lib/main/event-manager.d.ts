export type EventType = 'start' | 'stop' | 'error' | 'photo' | 'ready';
export interface EventDetail {
    status: 'success' | 'error';
    data?: any;
    error?: Error;
}
export type EventCallback = (detail: EventDetail) => void;
export declare class EventManager {
    private listeners;
    emit(event: EventType, detail: EventDetail): void;
    on(event: EventType, callback: EventCallback): void;
    off(event: EventType, callback: EventCallback): void;
    clear(): void;
}
