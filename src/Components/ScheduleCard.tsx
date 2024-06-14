import { createSignal, JSX } from 'solid-js';
import ClassDrawer from "./ClassDrawer.tsx";


interface ScheduleCardProps {
    scheduled_class?: any;
    status?: string;
}

export default function ScheduleCard({scheduled_class}: ScheduleCardProps): JSX.Element {
    const [isModalOpen, setModalOpen] = createSignal(false);


    function determineCardClass(status: string) {
        if (status === 'Aflyst!') {
            return 'card bg-error shadow-xl opacity-50';
        } else if (status === 'Ændret!') {
            return 'card bg-info shadow-xl';
        }
        return 'card bg-base-100 shadow-xl';
    }

    if (!scheduled_class) {
        return (
            <div class="card opacity-50 bg-base-300 shadow-xl">
                <div class="card-body p-2 text-center">
                    <h2 class="text-sm font-bold">Ingen Lektion</h2>
                    <p class="text-xs">Nyd Pausen</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div class={determineCardClass(scheduled_class.status)} onClick={() => setModalOpen(true)}>
                <div class="card-body p-2">
                    <h2 class="card-title text-sm font-bold">
                        {scheduled_class.class_name}
                    </h2>
                    <p class="text-xs">{scheduled_class.teacher}</p>
                    <p class="text-xs">{scheduled_class.room}</p>
                </div>
            </div>
            {isModalOpen() &&
                <ClassDrawer show={isModalOpen()} onClose={() => setModalOpen(false)} class={scheduled_class}/>}
        </>
    );
}
