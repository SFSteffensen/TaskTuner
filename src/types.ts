type Class = {
    status: string;
    class_name: string;
    teacher: string;
    room: string;
    description: string;
    time: string;
    day: string;
    homework: string;
    resources: string;
    notes: string;
};


type ScheduleData = Record<string, Record<string, Class | null>>;
