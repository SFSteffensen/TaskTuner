import useScheduleData from '../hooks/useScheduleData';
import ScheduleCard from './ScheduleCard.tsx';
import { getWeekNumber } from '../Util/getWeekNumber.ts';
import { DAY_NAMES, DAYS } from '../Util/constants.ts';
import { createICalendarEvents } from '../Util/createCalendarEvents.ts';
import { message, save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

function DesktopSchedule() {
  const {
    scheduleData,
    selectedWeek,
    handleWeekChange,
    getCachedScheduleData,
  } = useScheduleData();

  async function downloadSchedule() {
    // Get the current week's schedule data
    const currentWeekSchedule = getCachedScheduleData(selectedWeek());

    const iCalendarEvents = createICalendarEvents(currentWeekSchedule);

    await save({
      defaultPath: 'Skema.ics',
      filters: [
        {
          name: 'iCalendar',
          extensions: ['ics'],
        },
      ],
    })
      .then((res) => {
        // assert that the user didn't cancel the dialog
        if (res === null) {
          message('Ingen Undervisningsplan blev downloadet');
          return;
        }

        writeFile(res, new TextEncoder().encode(iCalendarEvents), {
          create: true,
        });

        message('Skema downloadet med succes');
      })
      .catch((err) => {
        message('Der opstod en fejl under download af tidsplanen');
        console.error(err);
      });
  }

  return (
    <div class="overflow-x-auto p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Class Schedule</h1>
        <button class="btn btn-primary" onMouseDown={downloadSchedule}>
          Tilføj Uge til Kalender
        </button>
      </div>
      <div class="mb-4 flex justify-center">
        <ul class="menu menu-horizontal bg-base-200 rounded-box hidden lg:flex">
          {Array.from(
            { length: 13 },
            (_, i) => selectedWeek() - 6 + i
          ).map((week) => (
            <li
              key={week}
              class={
                week === selectedWeek()
                  ? 'active bg-base-300'
                  : week === getWeekNumber(new Date())
                    ? 'bg-accent'
                    : ''
              }
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
              {DAYS.map((day) => (
                <th key={day}>
                  {DAY_NAMES[DAYS.indexOf(day)]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(scheduleData()).map((time) => (
              <tr key={time}>
                <td>{time}</td>
                {DAYS.map((day) => (
                  <td key={day}>
                    {scheduleData()[time][day] ? (
                      <ScheduleCard
                        scheduled_class={
                          scheduleData()[time][day]
                        }
                      />
                    ) : (
                      <ScheduleCard />
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
