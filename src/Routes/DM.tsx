import { createSignal, onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { useStore } from '../store';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function DM() {
    const { isLoggedIn } = useStore();
    const { pathname } = useLocation();
    const [theme, setTheme] = useTheme();

    if (!isLoggedIn()) {
        console.log('User not logged in. Redirecting to login page.');
        window.location.href = '/login?redirect=' + pathname;
    }

    onMount(() => {
        if (isLoggedIn()) {
            document.documentElement.setAttribute('data-theme', theme());
        }
    });

    return (
        <div>
            <h1>DM</h1>
        </div>
    );
}

export default DM;
