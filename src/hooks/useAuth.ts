import { createSignal, onCleanup } from 'solid-js';

function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = createSignal(Boolean(localStorage.getItem('isLoggedIn')));

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
  };

  // Synchronize isLoggedIn state with localStorage
  onCleanup(() => {
    const storedState = localStorage.getItem('isLoggedIn');
    if (storedState) {
      setIsLoggedIn(storedState === 'true');
    }
  });

  return { isLoggedIn, login, logout };
}

export default useAuth;
