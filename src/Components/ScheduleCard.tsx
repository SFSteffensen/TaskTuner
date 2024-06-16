import { createSignal, JSX } from 'solid-js';
import ClassDrawer from "./ClassDrawer.tsx";


interface ScheduleCardProps {
    scheduled_class?: Class;
    status?: string;
}

const BASE_CARD_CLASS = 'card bg-base-100 shadow-xl';
const CANCELLED_CARD_CLASS = 'card bg-error shadow-xl opacity-50';
const CHANGED_CARD_CLASS = 'card bg-info shadow-xl';


export default function ScheduleCard({scheduled_class}: ScheduleCardProps): JSX.Element {
    const [isModalOpen, setModalOpen] = createSignal(false);

    // Use a more descriptive function name
    function getCardClassBasedOnStatus(status: string) {
        let cardClass = BASE_CARD_CLASS;

        if (status === 'Aflyst!') {
            cardClass = CANCELLED_CARD_CLASS;
        } else if (status === 'Ændret!') {
            cardClass = CHANGED_CARD_CLASS;
        }
        return cardClass;
    }

    function openModal() {
        setModalOpen(true);
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
            <div class={`${getCardClassBasedOnStatus(scheduled_class.status)} hover:scale-105 transition-transform`}
                 onClick={openModal}>
                <div class="card-body p-2 ">
                    <h2 class="card-title text-sm font-bold">
                        {scheduled_class.class_name}
                    </h2>
                    <p class="text-xs">{scheduled_class.teacher}</p>
                    <p class="text-xs">{scheduled_class.room}</p>
                </div>
            </div>
            {isModalOpen() &&
                <ClassDrawer initialShow={isModalOpen()} class={scheduled_class} setModalOpen={setModalOpen}/>}
        </>
    );
}
