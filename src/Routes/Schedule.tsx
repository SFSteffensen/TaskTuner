import { createSignal, onMount } from 'solid-js';
import { useLocation } from "@solidjs/router";
import { useStore } from "../store";
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';  // Import the useTheme hook

function Schedule() {
  const { isLoggedIn } = useStore();
  const { pathname } = useLocation();
  const [scheduleData, setScheduleData] = createSignal({});
  const [theme] = useTheme(); // Use theme from the useTheme hook
  const days = ['ma', 'ti', 'on', 'to', 'fr']; // Danish abbreviations for the days of the week

  if (!isLoggedIn()) {
    console.log("User not logged in. Redirecting to login page.");
    window.location.href = "/login?redirect=" + pathname;
  }

  async function fetchSchedule() {
    try {
      const schoolId = localStorage.getItem('selectedSchoolId') || '';
      const response = await invoke('get_schedule', { schoolId: schoolId });
      const parsedData = JSON.parse(response);
      organizeSchedule(parsedData);
      console.log("Schedule data fetched successfully: ", parsedData);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  }

  function organizeSchedule(data) {
    const scheduleMap = {};
    data.forEach(classDetail => {
      const day = classDetail.day;
      const time = classDetail.time;
      if (!scheduleMap[time]) {
        scheduleMap[time] = {};
      }
      scheduleMap[time][day] = classDetail;
    });
    setScheduleData(scheduleMap);
  }

  onMount(() => {
    if (isLoggedIn()) {
      document.documentElement.setAttribute('data-theme', theme());
      fetchSchedule();
    }
  });

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Class Schedule</h1>
      <div class="w-full">
        <table class="table w-full table-compact table-fixed">
          <thead>
            <tr>
              <th>Tid</th>
              <th>Mandag</th>
              <th>Tirsdag</th>
              <th>Onsdag</th>
              <th>Torsdag</th>
              <th>Fredag</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(scheduleData()).map(time => (
              <tr key={time}>
                <td>{time}</td>
                {days.map(day => (
                  <td>
                    {scheduleData()[time][day] ? (
                      <div class="card bg-base-100 shadow-xl">
                        <div class="card-body p-2">
                          <h2 class="card-title text-sm font-bold">{scheduleData()[time][day].class_name}</h2>
                          <p class="text-xs">{scheduleData()[time][day].teacher}</p>
                          <p class="text-xs">{scheduleData()[time][day].room}</p>
                        </div>
                      </div>
                    ) : (
                      <div class="card bg-base-300 shadow-xl">
                        <div class="card-body p-2 text-center">
                          <p class="text-xs"> </p>
                          <h2 class="text-sm font-bold">Ingen Lektion</h2>
                          <p class="text-xs">Nyd Pausen</p>
                        </div>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Schedule;
