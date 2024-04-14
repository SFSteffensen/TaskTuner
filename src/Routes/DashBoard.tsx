import { createSignal, onMount } from 'solid-js';
import { useLocation } from "@solidjs/router";
import { useStore } from "../store";
import { invoke } from '@tauri-apps/api/core';

function DashBoard() {
  const { isLoggedIn } = useStore();
  const { pathname } = useLocation();

  const [dashboardData, setDashboardData] = createSignal('');

  if (!isLoggedIn()) {
    console.log("User not logged in. Redirecting to login page.");
    window.location.href = "/login?redirect=" + pathname;
  }

  async function fetchDashboard() {
    try {
      const schoolId = localStorage.getItem('selectedSchoolId') || '';
      console.log("School ID being sent to get_dashboard:", schoolId);
      const response = await invoke('get_dashboard', { schoolId: schoolId });
      console.log("Dashboard response:", response);
      setDashboardData(response);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    }
  }

  onMount(() => {
    if (isLoggedIn()) {
      fetchDashboard();
    }
  });

  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
      <div class="bg-white p-4 rounded shadow">
        <h2 class="text-xl">Dashboard Information:</h2>
        <p class="whitespace-pre-wrap">{dashboardData()}</p>
      </div>
    </div>
  );
}

export default DashBoard;
