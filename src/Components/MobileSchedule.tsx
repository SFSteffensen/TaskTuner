import { createSignal, onMount } from 'solid-js';
import useTheme from '../hooks/useTheme';
import ScheduleCard from "./ScheduleCard.tsx";
import useScheduleData from "../hooks/useScheduleData.ts";

function MobileSchedule() {
    const {scheduleData, selectedWeek, handleWeekChange} = useScheduleData();
    const [theme] = useTheme();
    const [selectedDay, setSelectedDay] = createSignal('ma');
    const days = ['ma', 'ti', 'on', 'to', 'fr'];
    const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];
    const weeks = Array.from({length: 52}, (_, i) => i + 1); // Weeks from 1 to 52


    function handleDayChange(newDay) {
        setSelectedDay(newDay);
    }

    onMount(() => {
        document.documentElement.setAttribute('data-theme', theme());
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
                                <ScheduleCard
                                    scheduled_class={scheduleData()[time][selectedDay()]}
                                />
                            ) : (
                                <ScheduleCard/>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MobileSchedule;
