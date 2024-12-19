import { Observable } from "rxjs";
import { EventDetail, EventType } from "./event-manager";
import { CameraState, PermissionResponse } from "../types/camera.types";
export declare class CameraManager {
    private readonly events;
    private readonly state$;
    get state(): CameraState;
    /**
     * Update camera state.
     * @param newState The new state to update.
     */
    private updateState;
    /**
     * Listen for state changes.
     * @returns Observable for camera state.
     */
    onStateChange(): Observable<CameraState>;
    private setupChangeListeners;
    /**
     * Subscribe to a specific event.
     * @param event The type of event.
     * @param callback The callback to execute when the event is emitted.
     */
    onEvent(event: EventType, callback: (detail: EventDetail) => void): void;
    /**
     * Unsubscribe from a specific event.
     * @param event The type of event.
     * @param callback The callback to remove.
     */
    offEvent(event: EventType, callback: (detail: EventDetail) => void): void;
    /**
     * Emit an event with details.
     * @param event The type of event.
     * @param detail The event details.
     */
    emitEvent(event: EventType, detail: EventDetail): void;
    getPermissionsAsync(): Promise<PermissionResponse>;
    handlePermissionsQueryAsync(query: 'camera' | 'microphone'): Promise<PermissionResponse>;
    /**
    * Check if the browser supports media devices
    */
    private checkMediaDevicesSupport;
    /**
     * Get list of available camera devices
     */
    getAvailableCameraDevices(): Promise<MediaDeviceInfo[]>;
    /**
     * Handle camera errors
     */
    private handleError;
}
