import { createSignal, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function Assignments() {
  const [assignments, setAssignments] = createSignal([]);
  const schoolId = localStorage.getItem('selectedSchoolId') || '';
  const [theme] = useTheme();


  onMount(async () => {
    document.documentElement.setAttribute('data-theme', theme()); // Apply saved theme on load
    try {
      const response = await invoke('get_assignments', { schoolId: schoolId });
      setAssignments(JSON.parse(response));
      console.log('Assignments:', assignments());
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  });

  return (
    <div>
      <h1>Assignments</h1>
      <ul>
        {assignments().map((assignment, index) => (
          <li key={index}>
            <h2>{assignment.title}</h2>
            <p>{assignment.description}</p>
            <p>Deadline: {assignment.due_date}</p>
            <p>Fravær: {assignment.responsible}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Assignments;
