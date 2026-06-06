/**
 * Backend sync (opt-in). The app is offline-first: it runs entirely on the
 * local store, and — when a backend URL is configured — pulls the authoritative
 * snapshot and pushes mutations through the typed RelayApi.
 *
 * Wire it up by setting EXPO_PUBLIC_RELAY_API and calling `pullFromBackend()`
 * on launch (e.g. in app/_layout.tsx). Left dormant by default so the app is
 * runnable standalone.
 */
import { createHttpApi } from '@/services/api';
import { useStore } from './store';

export const RELAY_API_URL = process.env.EXPO_PUBLIC_RELAY_API;

/** Pull the server snapshot into the store. No-op if no backend is configured. */
export async function pullFromBackend(baseUrl = RELAY_API_URL, token = 'dev'): Promise<boolean> {
  if (!baseUrl) return false;
  const api = createHttpApi(baseUrl, token);
  const snap = await api.pull();
  useStore.getState().hydrateFromServer(snap);
  return true;
}
