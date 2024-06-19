type Class = {
    status: string;
    class_name: string;
    teacher: string;
    room: string;
    description: string;
    time: string;
    day: string;
    date_time: string;
    homework: string;
    resources: string;
    notes: string;
    detailed_link: string;
};

type ScheduleData = Record<string, Record<string, Class | null>>;

type Day = 'ma' | 'ti' | 'on' | 'to' | 'fr';
