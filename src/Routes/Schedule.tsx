import DesktopSchedule from '../Components/DesktopSchedule';
import MobileSchedule from '../Components/MobileSchedule';

function Schedule() {
  return (
    <div class='pb-16'>
      <div class="hidden lg:block">
        <DesktopSchedule />
      </div>
      <div class="lg:hidden">
          <MobileSchedule/>
      </div>
    </div>
  );
}

export default Schedule;
