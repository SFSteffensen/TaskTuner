// useScheduleData.ts
import { createSignal, onCleanup, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/plugin-notification';
import { getWeekNumber } from '../Util/getWeekNumber.ts';

async function checkNotificationPermission() {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }

    return permissionGranted;
}

export default function useScheduleData() {
    const [scheduleData, setScheduleData] = createSignal<ScheduleData>({});
    const [selectedWeek, setSelectedWeek] = createSignal(
        getWeekNumber(new Date())
    );

    function cacheScheduleData(week: number, data: Class[]) {
        localStorage.setItem(`schedule_${week}`, JSON.stringify(data));
    }

    function getCachedScheduleData(week: number) {
        const cachedData = localStorage.getItem(`schedule_${week}`);
        return cachedData ? JSON.parse(cachedData) : null;
    }

    async function fetchSchedule(ignoreCache = false, week?: number) {
        const currentWeek = selectedWeek();
        const targetWeek = week ?? currentWeek;
        if (!ignoreCache) {
            const cachedData = getCachedScheduleData(targetWeek);
            if (cachedData && Array.isArray(cachedData)) {
                console.log(`Using cached data for week ${targetWeek}`);
                organizeSchedule(cachedData);
                return cachedData;
            }
        }
        try {
            const schoolId = localStorage.getItem('selectedSchoolId') || '';
            const response = (await invoke('get_schedule', {
                schoolId: schoolId,
                week: targetWeek,
            })) satisfies string;
            console.log('response:', response);
            const parsedData: Class[] = JSON.parse(response);
            if (Array.isArray(parsedData)) {
                const previousData = getCachedScheduleData(targetWeek);
                if (
                    JSON.stringify(previousData) !== JSON.stringify(parsedData)
                ) {
                    const permissionGranted =
                        await checkNotificationPermission();
                    if (permissionGranted) {
                        sendNotification({
                            title: 'Schedule Update',
                            body: `Schedule updated for week ${targetWeek}`,
                        });
                    }
                }
                organizeSchedule(parsedData);
                cacheScheduleData(targetWeek, parsedData);
                console.log('Schedule data fetched successfully: ', parsedData);
            } else {
                console.error('Error: parsed data is not an array');
            }
            return parsedData;
        } catch (error) {
            console.error('Error fetching scheduled_class:', error);
        }
    }

    function organizeSchedule(data: Class[]) {
        const scheduleMap: ScheduleData = {};
        data.forEach((_class) => {
            const day = _class.day;
            const time = _class.time;
            const dateTime = _class.date_time; // Extract the date_time field
            if (!scheduleMap[time]) {
                scheduleMap[time] = {};
            }
            scheduleMap[time][day] = { ..._class, date_time: dateTime }; // Add the date_time field to the scheduleMap
        });
        setScheduleData(scheduleMap);
    }

    async function refetchSchedules() {
        const currentWeek = getWeekNumber(new Date());
        const weeksToFetch = [currentWeek, currentWeek + 1, currentWeek + 2];

        for (const week of weeksToFetch) {
            await fetchSchedule(true, week);
        }
    }

    function handleWeekChange(newWeek: number) {
        setSelectedWeek(newWeek);
        fetchSchedule();
    }

    onMount(() => {
        fetchSchedule().then(() => {
            const interval = setInterval(() => {
                if (selectedWeek() === getWeekNumber(new Date())) {
                    refetchSchedules();
                }
            }, 300000); // 300000 ms = 5 minutes
            onCleanup(() => clearInterval(interval));
        });
    });

    return {
        scheduleData,
        selectedWeek,
        handleWeekChange,
        getCachedScheduleData,
    };
}
