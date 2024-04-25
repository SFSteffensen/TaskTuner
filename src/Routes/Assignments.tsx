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
            <h2>{assignment.title} - {assignment.team} (Week {assignment.week})</h2>
            <p>{assignment.assignment_note}</p>
            <p>Deadline: {assignment.deadline}</p>
            <p>Student Time: {assignment.student_time} hours</p>
            <p>Status: {assignment.status}</p>
            <p>Absence: {assignment.absence_percent}%</p>
            <p>Follow-up Needed: {assignment.follow_up}</p>
            <p>Grade: {assignment.grade}</p>
            <p>Student Note: {assignment.student_note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Assignments;
