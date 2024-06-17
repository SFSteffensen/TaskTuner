// useScheduleData.ts
import { createSignal, onCleanup, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { getWeekNumber } from "../Util/getWeekNumber.ts";

export default function useScheduleData() {
  const [scheduleData, setScheduleData] = createSignal<ScheduleData>({});
  const [selectedWeek, setSelectedWeek] = createSignal(getWeekNumber(new Date()));

  function cacheScheduleData(week: number, data: Class[]) {
    localStorage.setItem(`schedule_${week}`, JSON.stringify(data));
  }

  function getCachedScheduleData(week: number) {
    const cachedData = localStorage.getItem(`schedule_${week}`);
    return cachedData ? JSON.parse(cachedData) : null;
  }

  async function fetchSchedule(ignoreCache = false) {
    const week = selectedWeek();
    if (!ignoreCache) {
      const cachedData = getCachedScheduleData(week);
      if (cachedData && Array.isArray(cachedData)) {
        console.log(`Using cached data for week ${week}`);
        organizeSchedule(cachedData);
        console.log('cachedData:', cachedData);
        return;
      }
    }
    try {
      const schoolId = localStorage.getItem('selectedSchoolId') || '';
      const response = await invoke('get_schedule', {
        schoolId: schoolId,
        week: week,
      }) satisfies string;
      const parsedData: Class[] = JSON.parse(response);
      if (Array.isArray(parsedData)) {
        organizeSchedule(parsedData);
        cacheScheduleData(week, parsedData);
        console.log('Schedule data fetched successfully: ', parsedData);
      } else {
        console.error('Error: parsed data is not an array');
      }
    } catch (error) {
      console.error('Error fetching scheduled_class:', error);
    }
  }

  function organizeSchedule(data: Class[]) {
    const scheduleMap: ScheduleData = {};
    data.forEach((_class) => {
      const day = _class.day;
      const time = _class.time;
      if (!scheduleMap[time]) {
        scheduleMap[time] = {};
      }
      scheduleMap[time][day] = _class;
    });
    setScheduleData(scheduleMap);
  }

  function handleWeekChange(newWeek: number) {
    setSelectedWeek(newWeek);
    fetchSchedule();
  }

  onMount(() => {
    fetchSchedule().then(() => {
      const interval = setInterval(() => {
        if (selectedWeek() === getWeekNumber(new Date())) {
          fetchSchedule(true); // Ignore cache for current week
        }
      }, 300000); // 300000 ms = 5 minutes
      onCleanup(() => clearInterval(interval));
    });
  });

  return { scheduleData, selectedWeek, handleWeekChange };
}
