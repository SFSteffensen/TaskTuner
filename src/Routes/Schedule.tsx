import DesktopSchedule from '../Components/DesktopSchedule';
import MobileSchedule from '../Components/MobileSchedule';
import { onMount } from 'solid-js';
import useTheme from '../hooks/useTheme.ts';

function Schedule() {
    const [theme] = useTheme();

    onMount(() => {
        document.documentElement.setAttribute('data-theme', theme());
    });

    return (
        <div class="pb-16">
            <div class="hidden lg:block">
                <DesktopSchedule />
            </div>
            <div class="lg:hidden">
                <MobileSchedule />
            </div>
        </div>
    );
}

export default Schedule;
