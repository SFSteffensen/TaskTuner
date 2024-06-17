import { createEffect, createSignal, onCleanup } from 'solid-js';
import { open } from '@tauri-apps/plugin-shell';

interface ClassModalProps {
  initialShow: boolean;
  class?: Class;
  setModalOpen: (value: boolean) => void;
}

const TRANSLATE_X_FULL = 'translate-x-full';
const TRANSLATE_X_ZERO = 'translate-x-0';

const dayMap = {
  ma: 'Mandag',
  ti: 'Tirsdag',
  on: 'Onsdag',
  to: 'Torsdag',
  fr: 'Fredag',
};

function ClassDrawer(props: ClassModalProps) {
  let drawerRef: HTMLDivElement | undefined;
  const [isModalOpen, setModalOpen] = createSignal(props.initialShow);
  const [translateX, setTranslateX] = createSignal(isModalOpen() ? TRANSLATE_X_ZERO : TRANSLATE_X_FULL);

  createEffect(() => {
    if (isModalOpen()) {
      setTranslateX(TRANSLATE_X_FULL);
      setTimeout(() => setTranslateX(TRANSLATE_X_ZERO), 0);
    } else {
      setTranslateX(TRANSLATE_X_FULL);
      setTimeout(() => setTranslateX(TRANSLATE_X_ZERO), 300); // Adjust this to match the duration of your CSS transition
    }
  });

  const toggleModal = () => {
    setModalOpen(false);
    setTimeout(() => props.setModalOpen(false), 300);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (drawerRef && !drawerRef.contains(event.target as Node)) {
      toggleModal();
    }
  };

  createEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });
  });

  const getFullDayName = (shortDay: string) => {
    return dayMap[shortDay] || shortDay;
  };

  const openInBrowser = async (url: string) => {
    try {
      await open(url);
    } catch (e) {
      console.error("Failed to open URL", e);
    }
  };

  return (
    <div class={`fixed z-10 inset-0 overflow-y-auto flex justify-end`}>
      <div
        ref={drawerRef}
        class={`card bg-white shadow-lg transform transition-transform duration-500 ${translateX()} max-w-md w-full`}>
        <div class="p-6">
          <div class="flex justify-between items-center">
            <h2 class="text-lg leading-6 font-medium">
              {props.class?.class_name}
            </h2>
            <button
              class="btn btn-primary btn-sm"
              onMouseDown={toggleModal}>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <a onMouseDown={() => openInBrowser(props.class?.detailed_link)} class='cursor-pointer opacity-50 text-secondary'>Se På Lectio</a>
          <div class="mt-4 space-y-2">
            <p><span class="font-bold">Status:</span> {props.class?.status}</p>
            <p><span class="font-bold">Klassenavn:</span> {props.class?.class_name}</p>
            <p><span class="font-bold">Lærer:</span> {props.class?.teacher}</p>
            <p><span class="font-bold">Lokale:</span> {props.class?.room}</p>
            <p><span class="font-bold">Beskrivelse:</span> {props.class?.description}</p>
            <p><span class="font-bold">Tid:</span> {props.class?.time}</p>
            <p><span class="font-bold">Dag:</span> {getFullDayName(props.class?.day)}</p>
            <p><span class="font-bold">Lektier:</span> {props.class?.homework}</p>
            <p><span class="font-bold">Ressourcer:</span> {props.class?.resources}</p>
            <p><span class="font-bold">Noter:</span> {props.class?.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassDrawer;
