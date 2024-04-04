import { useLocation } from "@solidjs/router";
import { useStore } from "../store";

function DashBoard() {
  const { isLoggedIn } = useStore();
  const { pathname } = useLocation();

  console.log(isLoggedIn())

  if (!isLoggedIn()) {
    console.log("User not logged in. Redirecting to login page.");
    window.location.href = "/login?redirect=" + pathname;
  }

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}

export default DashBoard;
