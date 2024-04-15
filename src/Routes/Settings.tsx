import { onMount } from 'solid-js';
import { useLocation } from "@solidjs/router";
import { useStore } from "../store";
import useTheme from '../hooks/useTheme';

function Settings() {
  const { isLoggedIn } = useStore();
  const { pathname } = useLocation();
  const [theme, changeTheme] = useTheme(); // Utilizing the custom hook for theme management

  if (!isLoggedIn()) {
    console.log("User not logged in. Redirecting to login page.");
    window.location.href = "/login?redirect=" + pathname;
  }

  onMount(() => {
    if (isLoggedIn()) {
      console.log("User is logged in.");
    }
    console.log("page: {} loaded", pathname);
  });

  return (
    <div>
      <div class="overflow-x-auto p-4">
        <h1 class="text-2xl font-bold">Settings</h1>
        <h2>Tema:</h2>
        <div class="dropdown mb-72">
          <div tabindex="0" role="button" class="btn m-1">
            Theme
            <svg width="12px" height="12px" class="h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52">
            {['light', 'dark', 'nord', 'retro', 'black', 'lofi', 'night', 'cyberpunk', 'aqua', 'valentine', 'pastel'].map(t => (
              <li key={t}>
                <input
                  type="radio"
                  name="theme-dropdown"
                  class="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                  aria-label={t.charAt(0).toUpperCase() + t.slice(1)}
                  value={t}
                  checked={theme() === t}
                  onChange={(e) => changeTheme(e.currentTarget.value)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;
