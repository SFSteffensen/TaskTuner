import { createSignal, onCleanup } from 'solid-js';

interface ClassModalProps {
    show: boolean;
    onClose: () => void;
    class?: Class;
}

function ClassModal(props: ClassModalProps) {
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
        <div class={`fixed z-10 inset-0 overflow-y-auto flex justify-end transition-transform duration-500`}>
            <div
                class={`bg-white w-1/3 h-full overflow-auto transform transition-transform duration-500 ${translateX()}`}>
                <div class="p-6 relative"> {/* Add relative here */}
                    <button
                        class="absolute top-0 left-0 btn btn-square m-2 "
                        onClick={props.onClose}>
                        Luk
                    </button>
                    <h2 class="text-lg leading-6 font-medium text-gray-900 mt-8"> {/* Add mt-8 to give space for the button */}
                        {props.class?.class_name}
                    </h2>
                    <p class="mt-2 text-sm text-gray-500">
                        {props.class?.teacher}
                    </p>
                    {/* ... rest of your class information ... */}
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

export default ClassModal;
