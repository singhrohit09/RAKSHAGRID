/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';

export type RealtimeStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

type RealtimeCallback<T = unknown> = (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T; old: T | null }) => void;

class RealtimeService {
  private status: RealtimeStatus = 'DISCONNECTED';
  private statusListeners: Set<(status: RealtimeStatus) => void> = new Set();
  private localBus: EventTarget = new EventTarget();
  private broadcastChannel: BroadcastChannel | null = null;
  private activeSubscriptions: Map<string, unknown> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('rakshagrid_realtime_mesh');
        this.broadcastChannel.onmessage = (event) => {
          const { table, payload } = event.data || {};
          if (table && payload) {
            this.localBus.dispatchEvent(new CustomEvent(table, { detail: payload }));
          }
        };
      } catch (err) {
        console.warn('[RakshaGrid Realtime] BroadcastChannel unavailable, using in-memory bus:', err);
      }
    }

    this.initializeConnection();
  }

  private setStatus(newStatus: RealtimeStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((listener) => listener(newStatus));
    }
  }

  public getStatus(): RealtimeStatus {
    return this.status;
  }

  public onStatusChange(callback: (status: RealtimeStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  private initializeConnection() {
    if (isSupabaseConfigured && supabase) {
      this.setStatus('RECONNECTING');
      try {
        const channel = supabase.channel('system_status');
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.setStatus('CONNECTED');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.setStatus('DISCONNECTED');
          }
        });
      } catch (err) {
        console.warn('[RakshaGrid Realtime] Supabase subscription failed, operating on local real-time mesh:', err);
        this.setStatus('CONNECTED');
      }
    } else {
      // Local operational mesh active (in-browser broadcast + memory bus)
      this.setStatus('CONNECTED');
    }
  }

  public subscribeToTable<T = unknown>(tableName: string, callback: RealtimeCallback<T>): () => void {
    const handleLocalEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        callback(customEvent.detail);
      }
    };

    this.localBus.addEventListener(tableName, handleLocalEvent);

    // If Supabase is connected, subscribe to Postgres changes
    let supabaseChannel: unknown = null;
    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        supabaseChannel = client
          .channel(`table_${tableName}`)
          .on(
            'postgres_changes' as never,
            { event: '*', schema: 'public', table: tableName },
            (payload: unknown) => {
              callback(payload as Parameters<RealtimeCallback<T>>[0]);
            }
          )
          .subscribe();
      } catch (err) {
        console.warn(`[RakshaGrid Realtime] Failed remote subscription to ${tableName}:`, err);
      }
    }

    return () => {
      this.localBus.removeEventListener(tableName, handleLocalEvent);
      if (supabaseChannel && client) {
        client.removeChannel(supabaseChannel as never);
      }
    };
  }

  public broadcastLocalChange<T = unknown>(
    tableName: string,
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    record: T,
    oldRecord: T | null = null
  ) {
    const payload = { eventType, new: record, old: oldRecord };

    // Emit to in-memory listeners
    this.localBus.dispatchEvent(new CustomEvent(tableName, { detail: payload }));

    // Emit to other browser tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ table: tableName, payload });
      } catch (err) {
        console.warn('[RakshaGrid Realtime] Failed to postMessage on BroadcastChannel:', err);
      }
    }
  }
}

export const realtimeService = new RealtimeService();
