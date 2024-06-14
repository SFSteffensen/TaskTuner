import { createEffect } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

function useCheckClientInitialized() {
  createEffect(async () => {
    try {
      const isInitialized = await invoke('is_client_initialized');
      if (!isInitialized) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error checking client initialization:', error);
      window.location.href = '/login';
    }
  });
}

export default useCheckClientInitialized;
