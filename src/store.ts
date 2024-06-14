import { createEffect, createSignal } from "solid-js";

// Initialize isLoggedIn from localStorage
const [isLoggedIn, setIsLoggedIn] = createSignal(
  Boolean(localStorage.getItem("isLoggedIn"))
);

// Update localStorage whenever isLoggedIn changes

createEffect(() => {
  localStorage.setItem("isLoggedIn", String(isLoggedIn()));
});

export function useStore() {
  return {
    isLoggedIn,
    setIsLoggedIn,
  };
}
