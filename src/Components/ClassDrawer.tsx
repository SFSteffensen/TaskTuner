import { createSignal, onCleanup } from 'solid-js';

interface ClassModalProps {
    show: boolean;
    onClose: () => void;
    class?: Class;
}

function ClassDrawer(props: ClassModalProps) {
    const [translateX, setTranslateX] = createSignal(props.show ? 'translate-x-0' : 'translate-x-full');
    const [shouldRender, setShouldRender] = createSignal(props.show);

    if (props.show) {
        setTranslateX('translate-x-full');
        setShouldRender(true);
        setTimeout(() => setTranslateX('translate-x-0'), 0);
    } else {
        setTranslateX('translate-x-0');
        setTimeout(() => {
            setTranslateX('translate-x-full');
            setTimeout(() => setShouldRender(false), 500);
        }, 0);
    }

    onCleanup(() => clearTimeout(1));

    return (
        <div class={`fixed z-10 inset-0 overflow-y-auto flex justify-end`}>
            <div
                class={`card bg-base-100 shadow-xl transform transition-transform duration-500 ${translateX()}`}>
                <div class="p-6">
                    <button
                        class="btn btn-primary btn-sm m-2 "
                        onClick={props.onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                    <h2 class="text-lg leading-6 font-medium  mt-8"> {/* Add mt-8 to give space for the button */}
                        {props.class?.class_name}
                    </h2>
                    <p class="mt-2 text-sm text-gray-500">
                        {props.class?.teacher}
                    </p>
                    <p>Status: {props.class?.status}</p>
                    <p>Class Name: {props.class?.class_name}</p>
                    <p>Teacher: {props.class?.teacher}</p>
                    <p>Room: {props.class?.room}</p>
                    <p>Description: {props.class?.description}</p>
                    <p>Time: {props.class?.time}</p>
                    <p>Day: {props.class?.day}</p>
                    <p>Homework: {props.class?.homework}</p>
                    <p>Resources: {props.class?.resources}</p>
                    <p>Notes: {props.class?.notes}</p>
                </div>
            </div>
        </div>
    );
}

export default ClassDrawer;
