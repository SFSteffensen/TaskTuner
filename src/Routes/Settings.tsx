import { invoke } from '@tauri-apps/api/core';
import { createEffect, createSignal, onMount } from 'solid-js';
import useTheme from '../hooks/useTheme';
import { useStore } from "../store";

function Settings() {
  const { isLoggedIn } = useStore();
  const [theme, setTheme] = createSignal(localStorage.getItem('theme') || 'light');
  const [absenceData, setAbsenceData] = createSignal({});
  const schoolId = localStorage.getItem('selectedSchoolId') || '';


  const changeTheme = (newTheme) => {
    setTheme(newTheme); // Update the local state
    localStorage.setItem('theme', newTheme); // Save the new theme to localStorage
    document.documentElement.setAttribute('data-theme', newTheme); // Apply the theme
  };

  async function fetchAbsence() {
    try {
      const response = await invoke('get_absence', { schoolId: schoolId });
      setAbsenceData(JSON.parse(response));
      console.log('Absence data fetched:', JSON.parse(response));
    } catch (error) {
      console.error('Failed to fetch absence data:', error);
    }
  }

  onMount(() => {
    if (isLoggedIn()) {
      document.documentElement.setAttribute('data-theme', theme()); // Apply saved theme on load
      fetchAbsence();
    }
  });

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold">Mere</h1>
      <div class="join join-vertical w-full">
        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">
            Fravær
          </div>
          <div class="collapse-content">
            {absenceData() ? (
              <ul>
                {Object.entries(absenceData()).map(([team, details]) => (
                  <li key={team}>
                    {team}: {details.opgjort.procent}, {details.for_the_year.procent}
                  </li>
                ))}
              </ul>
            ) : <p>Loading absence data...</p>}
          </div>
        </div>

        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">
            Dokumenter
          </div>
          <div class="collapse-content">
            <p>Dokumenter kommer senere</p>
          </div>
        </div>

        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">
            Karakterer
          </div>
          <div class="collapse-content">
            <p>Karaktere kommer senere</p>
          </div>
        </div>

        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">
            Tema
          </div>
          <div class="collapse-content">
            <div>
              {['light', 'dark', 'nord', 'retro', 'black', 'lofi', 'night', 'cyberpunk', 'aqua', 'valentine', 'pastel'].map(t => (
                <div class="form-control">
                  <label class="label cursor-pointer gap-4">
                    <span class="label-text">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                    <input
                      type="radio"
                      name="theme-radios"
                      class="radio theme-controller"
                      value={t}
                      checked={theme() === t}
                      onChange={(e) => changeTheme(e.currentTarget.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
