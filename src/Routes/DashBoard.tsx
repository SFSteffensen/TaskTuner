import { createSignal, onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function DashBoard() {
  const [dashboardData, setDashboardData] = createSignal('');
  const [theme, setTheme] = useTheme(); // Use the theme from the useTheme hook

  function linkify(inputText) {
    let replacedText;

    // Convert newlines to HTML breaks
    replacedText = inputText.replace(/\n/g, '<br>');

    // URLs starting with http://, https://, or ftp://
    const urlRegex =
      /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = replacedText.replace(
      urlRegex,
      '<a href="$1" target="_blank" class="link link-primary">$1</a>'
    );

    // URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    const pseudoUrlRegex = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(
      pseudoUrlRegex,
      '$1<a href="http://$2" target="_blank" class="link link-primary">$2</a>'
    );

    // Change email addresses to mailto:: links.
    const emailAddressRegex = /(\S+@\S+\.\S+)/gim;
    replacedText = replacedText.replace(
      emailAddressRegex,
      '<a href="mailto:$1" class="link link-primary">$1</a>'
    );

    // Danish phone numbers as continuous 8 digits or separated into two blocks of four
    const phoneNumberRegex = /(\b\d{4}[\s-]?\d{4}\b)/gim;
    replacedText = replacedText.replace(
      phoneNumberRegex,
      '<a href="tel:$1" class="link link-primary">$1</a>'
    );

    return replacedText;
  }

  async function fetchDashboard() {
    try {
      const schoolId = localStorage.getItem('selectedSchoolId') || '';
      const response = await invoke('get_dashboard', {
        schoolId: schoolId,
      });
      console.log('Dashboard data fetched successfully: ', response);
      setDashboardData(linkify(response));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  }

  onMount(() => {
    document.documentElement.setAttribute('data-theme', theme());
    fetchDashboard();
  });

  return (
    <div>
      <div class="p-4">
        <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
        <div class="bg-base-200 p-4 rounded-xl shadow">
          <div innerHTML={dashboardData()} />
        </div>
      </div>
    </div>
  );
}

export default DashBoard;
