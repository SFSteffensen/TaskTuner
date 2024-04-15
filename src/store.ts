import { createEffect, createSignal } from 'solid-js';

// Initialize isLoggedIn from localStorage
const [isLoggedIn, setIsLoggedIn] = createSignal(Boolean(localStorage.getItem('isLoggedIn')));

// Update localStorage whenever isLoggedIn changes

// TODO: fix this bullshit implementation as it sets IsLoggedIn to true even if the user is not logged in, and the user is redirected to the dashboard which can't fetch the data because the user is not logged in.
createEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn()));
});

export function useStore() {
    return {
        isLoggedIn,
        setIsLoggedIn
    };
}
