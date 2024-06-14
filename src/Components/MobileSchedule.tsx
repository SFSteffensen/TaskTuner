import { createSignal, onMount, onCleanup } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function MobileSchedule() {
  const [scheduleData, setScheduleData] = createSignal({});
  const [theme] = useTheme();
  const [selectedWeek, setSelectedWeek] = createSignal(new Date().getWeekNumber());
  const [selectedDay, setSelectedDay] = createSignal('ma');
  const days = ['ma', 'ti', 'on', 'to', 'fr'];
  const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1); // Weeks from 1 to 52

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
      const response = await invoke('get_schedule', {
        schoolId: schoolId,
        week: week,
      });
      const parsedData = JSON.parse(response);
      organizeSchedule(parsedData);
      cacheScheduleData(week, parsedData);
      console.log('Schedule data fetched successfully: ', parsedData);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  }

  function organizeSchedule(data) {
    const scheduleMap = {};
    data.forEach((classDetail) => {
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

  function handleDayChange(newDay) {
    setSelectedDay(newDay);
  }

  onMount(() => {
    document.documentElement.setAttribute('data-theme', theme());
    fetchSchedule();
    const interval = setInterval(() => {
      if (selectedWeek() === new Date().getWeekNumber()) {
        fetchSchedule(true); // Ignore cache for current week
      }
    }, 300000); // 300000 ms = 5 minutes
    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold mb-4">
        Uge{' '}
        <select
          class="select select-bordered w-auto inline-block"
          value={selectedWeek()}
          onInput={(e) => handleWeekChange(parseInt(e.currentTarget.value))}
        >
          {weeks.map((week) => (
            <option value={week} key={week}>
              {week}
            </option>
          ))}
        </select>
      </h1>
      <div class="mb-4 flex justify-center">
        <ul class="menu menu-horizontal bg-base-200 rounded-box lg:hidden">
          {days.map((day, index) => (
            <li
              key={day}
              class={day === selectedDay() ? 'active bg-base-300' : ''}
              onMouseDown={() => handleDayChange(day)}
            >
              <a>
                {dayNames[index]}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div class="lg:hidden">
        {Object.keys(scheduleData()).map((time) => (
          <div key={time} class="grid grid-cols mb-4">
            <div class="font-bold">{time}</div>
            <div>
              {scheduleData()[time][selectedDay()] ? (
                <div>
                  <div class={determineCardClass(scheduleData()[time][selectedDay()].status)}>
                    <div class="card-body p-2">
                      <h2 class="card-title text-sm font-bold">
                        {scheduleData()[time][selectedDay()].class_name}
                      </h2>
                      <p class="text-xs">{scheduleData()[time][selectedDay()].teacher}</p>
                      <p class="text-xs">{scheduleData()[time][selectedDay()].room}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div class="card opacity-50 bg-base-300 shadow-xl">
                  <div class="card-body p-2 text-center">
                    <h2 class="text-sm font-bold">Ingen Lektion</h2>
                    <p class="text-xs">Nyd Pausen</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
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

export default MobileSchedule;
