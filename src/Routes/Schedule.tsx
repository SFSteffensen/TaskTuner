import { createSignal, onMount, onCleanup } from 'solid-js';
import { useLocation } from "@solidjs/router";
import { useStore } from "../store";
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function Schedule() {
  const { isLoggedIn } = useStore();
  const { pathname } = useLocation();
  const [scheduleData, setScheduleData] = createSignal({});
  const [theme] = useTheme();
  const [selectedWeek, setSelectedWeek] = createSignal(new Date().getWeekNumber());
  const days = ['ma', 'ti', 'on', 'to', 'fr'];

  if (!isLoggedIn()) {
    console.log("User not logged in. Redirecting to login page.");
    window.location.href = "/login?redirect=" + pathname;
  }

  function cacheScheduleData(week, data) {
    localStorage.setItem(`schedule_${week}`, JSON.stringify(data));
  }

  function getCachedScheduleData(week) {
    const cachedData = localStorage.getItem(`schedule_${week}`);
    return cachedData ? JSON.parse(cachedData) : null;
  }

  async function fetchSchedule(ignoreCache = false) {
    const week = selectedWeek();
    if (!ignoreCache) {
      const cachedData = getCachedScheduleData(week);
      if (cachedData) {
        console.log(`Using cached data for week ${week}`);
        organizeSchedule(cachedData);
        return;
      }
    }

    try {
      const schoolId = localStorage.getItem('selectedSchoolId') || '';
      const response = await invoke('get_schedule', { schoolId: schoolId, week: week });
      const parsedData = JSON.parse(response);
      organizeSchedule(parsedData);
      cacheScheduleData(week, parsedData);
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

  function determineCardClass(status) {
    if (status === 'Aflyst!') {
      return 'card bg-error shadow-xl opacity-50';
    } else if (status === 'Ændret!') {
      return 'card bg-info shadow-xl';
    }
    return 'card bg-base-100 shadow-xl';
  }

  function handleWeekChange(newWeek) {
    setSelectedWeek(newWeek);
    fetchSchedule();
  }

  onMount(() => {
    if (isLoggedIn()) {
      document.documentElement.setAttribute('data-theme', theme());
      fetchSchedule();
      const interval = setInterval(() => {
        if (selectedWeek() === new Date().getWeekNumber()) {
          fetchSchedule(true); // Ignore cache for current week
        }
      }, 300000); // 300000 ms = 5 minutes
      onCleanup(() => clearInterval(interval));
    }
  });

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Class Schedule</h1>
      <div class="mb-4 flex justify-center">
        <ul class="menu menu-horizontal bg-base-200 rounded-box">
          {Array.from({ length: 13 }, (_, i) => selectedWeek() - 6 + i).map(week => (
            <li key={week} class={week === selectedWeek() ? 'active bg-base-300' : week === new Date().getWeekNumber() ? 'bg-accent' : ''} onClick={() => handleWeekChange(week)}>
              <a>Uge {week}</a>
            </li>
          ))}
        </ul>
      </div>
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
                  <td key={day}>
                    {scheduleData()[time][day] ? (
                      <div class={determineCardClass(scheduleData()[time][day].status)}>
                        <div class="card-body p-2">
                          <h2 class="card-title text-sm font-bold">{scheduleData()[time][day].class_name}</h2>
                          <p class="text-xs">{scheduleData()[time][day].teacher}</p>
                          <p class="text-xs">{scheduleData()[time][day].room}</p>
                        </div>
                      </div>
                    ) : (
                      <div class="card opacity-50 bg-base-300 shadow-xl">
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

// Utility function to get the week number of a given date
Date.prototype.getWeekNumber = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return weekNo;
};

export default Schedule;
