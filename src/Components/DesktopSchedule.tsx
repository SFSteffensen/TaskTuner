import { onMount } from 'solid-js';
import useTheme from '../hooks/useTheme';
import useScheduleData from '../hooks/useScheduleData';
import ScheduleCard from "./ScheduleCard.tsx";
import { getWeekNumber } from "../Util/getWeekNumber.ts";

function DesktopSchedule() {
    const [theme] = useTheme();
    const days = ['ma', 'ti', 'on', 'to', 'fr'];
    const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];

    const {scheduleData, selectedWeek, handleWeekChange} = useScheduleData();


    onMount(() => {
        document.documentElement.setAttribute('data-theme', theme());
    });

    return (
        <div class="overflow-x-auto p-4">
            <h1 class="text-2xl font-bold mb-4">Class Schedule</h1>
            <div class="mb-4 flex justify-center">
                <ul class="menu menu-horizontal bg-base-200 rounded-box hidden lg:flex">
                    {Array.from({length: 13}, (_, i) => selectedWeek() - 6 + i).map((week) => (
                        <li
                            key={week}
                            class={week === selectedWeek() ? 'active bg-base-300' : week === getWeekNumber(new Date()) ? 'bg-accent' : ''}
                            onMouseDown={() => handleWeekChange(week)}
                        >
                            <a>Uge {week}</a>
                        </li>
                    ))}
                </ul>
            </div>
            <div class="w-full">
                <table class="table w-full table-compact table-fixed hidden lg:table">
                    <thead>
                    <tr>
                        <th class="w-16">Tid</th>
                        {days.map((day) => (
                            <th key={day}>{dayNames[days.indexOf(day)]}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {Object.keys(scheduleData()).map((time) => (
                        <tr key={time}>
                            <td>{time}</td>
                            {days.map((day) => (
                                <td key={day}>
                                    {scheduleData()[time][day] ? (
                                        <ScheduleCard
                                            scheduled_class={scheduleData()[time][day]}
                                        />
                                    ) : (
                                        <ScheduleCard/>
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

export default DesktopSchedule;
