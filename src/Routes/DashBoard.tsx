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

  function linkify(inputText) {
    let replacedText;

    // Convert newlines to HTML breaks
    replacedText = inputText.replace(/\n/g, '<br>');

    // URLs starting with http://, https://, or ftp://
    const urlRegex = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = replacedText.replace(urlRegex, '<a href="$1" target="_blank" class="link link-primary">$1</a>');

    // URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    const pseudoUrlRegex = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(pseudoUrlRegex, '$1<a href="http://$2" target="_blank" class="link link-primary">$2</a>');

    // Change email addresses to mailto:: links.
    const emailAddressRegex = /(\S+@\S+\.\S+)/gim;
    replacedText = replacedText.replace(emailAddressRegex, '<a href="mailto:$1" class="link link-primary">$1</a>');

    // Danish phone numbers as continuous 8 digits or separated into two blocks of four
    const phoneNumberRegex = /(\b\d{4}[\s-]?\d{4}\b)/gim;
    replacedText = replacedText.replace(phoneNumberRegex, '<a href="tel:$1" class="link link-primary">$1</a>');

    return replacedText;
  }


  async function fetchDashboard() {
    try {
      const schoolId = localStorage.getItem('selectedSchoolId') || '';
      const response = await invoke('get_dashboard', { schoolId: schoolId });
      console.log("Dashboard data fetched successfully: ", response);
      setDashboardData(linkify(response));
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
    <div>
      <div class="p-4">
        <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
        <div class="bg-white p-4 rounded shadow">
          <div innerHTML={dashboardData()} />
        </div>
      </div>
      <a href="/Schedule" class="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-full shadow-lg">
      </a>
    </div>
  );
}

export default DashBoard;
