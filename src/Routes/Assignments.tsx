import { createSignal, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function Assignments() {
  const [assignments, setAssignments] = createSignal([]);
  const [filter, setFilter] = createSignal('Venter');
  const [sortBy, setSortBy] = createSignal('deadline'); // Options: 'student_time', 'deadline', 'urgency'
  const schoolId = localStorage.getItem('selectedSchoolId') || '';
  const [theme] = useTheme();

  onMount(async () => {
    document.documentElement.setAttribute('data-theme', theme());
    try {
      const response = await invoke('get_assignments', { schoolId });
      setAssignments(JSON.parse(response));
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  });

  function parseEuropeanDate(dateStr) {
    const parts = dateStr.split('/');
    return new Date(`${parts[2]}/${parts[1]}/${parts[0]}`); // Adjusts to mm/dd/yyyy for JavaScript compatibility
  }

  function formatDateString(dateStr) {
    const regex = /(\d{1,2})\/(\d{1,2})-(\d{4})/;
    return dateStr.replace(regex, (match, day, month, year) => `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`);
  }

  const filteredAssignments = () => {
    return assignments().filter((assignment) => {
      return filter() === 'Both' || assignment.status === filter();
    }).sort((a, b) => {
      switch (sortBy()) {
        case 'student_time':
          return a.student_time - b.student_time; // Already a float, no need to parse
        case 'urgency':
          return b.urgency - a.urgency; // Higher urgency first
        case 'deadline':
          const dateA = parseEuropeanDate(a.deadline);
          const dateB = parseEuropeanDate(b.deadline);
          return dateA - dateB;
        default:
          return 0;
      }
    });
  };

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Assignments</h1>
      <div>
        <select onInput={(e) => setFilter(e.currentTarget.value)}>
          <option value="Venter">Venter</option>
          <option value="Afleveret">Afleveret</option>
          <option value="Both">Both</option>
        </select>
        <select onInput={(e) => setSortBy(e.currentTarget.value)}>
          <option value="deadline">Afleveringsfrist</option>
          <option value="student_time">Elevtimer</option>
          <option value="urgency">Urgency Score</option>
        </select>
      </div>
      <div class="w-full mt-4">
        <table class="table w-full table-compact table-fixed">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Afleveringsfrist</th>
              <th>Elevtimer</th>
              <th>Status</th>
              <th>Urgency Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments().map((assignment, index) => (
              <tr key={index}>
                <td class="font-bold">{assignment.title}</td>
                <td>{formatDateString(assignment.deadline)}</td>
                <td>{assignment.student_time.toFixed(2)}</td>
                <td>{assignment.status}</td>
                <td>{assignment.urgency.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Assignments;
