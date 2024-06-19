import { createSignal, onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function DM() {
    const [theme, setTheme] = useTheme();

    onMount(() => {
        document.documentElement.setAttribute('data-theme', theme());
    });

    return (
        <div>
            <h1>DM</h1>
        </div>
    );
}

export default DM;
