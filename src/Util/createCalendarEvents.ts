import { createEvents, EventAttributes, EventStatus } from 'ics';

export function createICalendarEvents(classes: Class[]) {
    const events = classes.map((classItem) => {
        // Parse the date and time from the classItem
        const [day, month, year] = classItem.date_time
            .split(' ')[0]
            .split('/')
            .map(Number);
        const [startTime, endTime] = classItem.time.split(' - ');
        const [startHour, startMinute] = startTime.split(':').map(Number);

        return {
            start: [year, month, day, startHour, startMinute],
            title: classItem.class_name,
            status: statusFromLectio(classItem.status),
            description: classItem.description,
            duration: getDuration(startTime, endTime),
        } satisfies EventAttributes;
    });
    const calendarEvents = createEvents(events);

    // Check if there was an error creating the events
    if (calendarEvents.error) {
        console.error(
            'Failed to create calendar events:',
            calendarEvents.error
        );
        throw new Error('Failed to create calendar events');
    }

    // Return the iCalendar data as a string
    return calendarEvents.value;
}

function statusFromLectio(status: string): EventStatus {
    switch (status) {
        case 'Aflyst!':
            return 'CANCELLED';
        case 'Ændret!':
            return 'TENTATIVE';
        default:
            return 'CONFIRMED';
    }
}

function getDuration(
    startTime: string,
    endTime: string
): { hours: number; minutes: number } {
    // Create Date objects for the start time and end time
    const startDate = new Date(`1970-01-01T${startTime}:00`);
    const endDate = new Date(`1970-01-01T${endTime}:00`);

    // Calculate the difference in milliseconds
    const diffMs = endDate.getTime() - startDate.getTime();

    // Convert the difference to minutes
    const diffMins = diffMs / (1000 * 60);

    // Calculate the hours and minutes
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    return { hours, minutes };
}
