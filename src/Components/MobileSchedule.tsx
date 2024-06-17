import { createSignal } from 'solid-js';
import ScheduleCard from "./ScheduleCard.tsx";
import useScheduleData from "../hooks/useScheduleData.ts";
import { DAY_NAMES, DAYS, WEEKS } from "../Util/constants.ts";

function MobileSchedule() {
  const { scheduleData, selectedWeek, handleWeekChange } = useScheduleData();
  const [selectedDay, setSelectedDay] = createSignal<Day>('ma');

  function handleDayChange(newDay: Day) {
    setSelectedDay(newDay);
  }

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold mb-4">
        Uge{' '}
        <select
          class="select select-bordered w-auto inline-block"
          value={selectedWeek()}
          onInput={(e) => handleWeekChange(parseInt(e.currentTarget.value))}
        >
          {WEEKS.map((week) => (
            <option value={week} key={week}>
              {week}
            </option>
          ))}
        </select>
      </h1>
      <div class="mb-4 flex justify-center">
        <ul class="menu menu-horizontal bg-base-200 rounded-box lg:hidden">
          {DAYS.map((day, index) => (
            <li
              key={day}
              class={day === selectedDay() ? 'active bg-base-300' : ''}
              onMouseDown={() => handleDayChange(day as Day)}
            >
              <a>
                {DAY_NAMES[index]}
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
                <ScheduleCard />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MobileSchedule;
