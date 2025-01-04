import { CameraError, CameraErrorCode } from "../types/error.types";
export type EventType = 'deviceChange' | 'streamStart' | 'streamStop' | 'capture' | 'recordStart' | 'recordStop' | 'onSettingsChange' | 'error';
export interface EventDetail {
    status: 'success' | 'error';
    data?: any;
    error?: CameraError<CameraErrorCode>;
}
export type EventCallback = (detail: EventDetail) => void;
export declare class EventManager {
    private listeners;
    emit(event: EventType, detail: EventDetail): void;
    on(event: EventType, callback: EventCallback): void;
    off(event: EventType, callback: EventCallback): void;
    clear(): void;
}
