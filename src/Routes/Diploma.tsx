import { createEffect, createSignal, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function Diploma() {
  const [theme] = useTheme();
  const [diplomaData, setDiplomaData] = createSignal([]);
  const schoolId = localStorage.getItem('selectedSchoolId') || '';

  async function fetchDiploma() {
    try {
      const response = await invoke('get_diploma', { schoolId: schoolId });
      const data = JSON.parse(response);
      setDiplomaData(data);
    } catch (error) {
      console.error('Failed to fetch diploma data:', error);
    }
  }


  onMount(() => {
    document.documentElement.setAttribute('data-theme', theme());
    fetchDiploma();
  });

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Diploma</h1>
      {diplomaData().length > 0 ? (
        <table class="table table-xs md:table-sm lg:table-md xl:table-lg w-full table-compact table-fixed whitespace-normal">
          <thead class="whitespace-normal">
            <tr>
              <th>Fag</th>
              <th>Årskarakter Vægt</th>
              <th>Årskarakter</th>
              <th>ECTS</th>
              <th>Eksamenskarakter Vægt</th>
              <th>Eksamenskarakter</th>
              <th>ECTS</th>
            </tr>
          </thead>
          <tbody>
            {diplomaData().map((detail, index) => (
              <tr key={index}>
                <td>{detail.subject}</td>
                <td>{detail.year_weight}</td>
                <td>{detail.year_grade}</td>
                <td>{detail.year_ects}</td>
                <td>{detail.exam_weight}</td>
                <td>{detail.exam_grade}</td>
                <td>{detail.exam_ects}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="7" class="text-right font-bold">
                Samlet Karaktergennemsnit: {calculateAverage(diplomaData())}
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p>Loading diploma data...</p>
      )}
    </div>
  );
}

function calculateAverage(diplomaData) {
  let totalWeight = 0;
  let weightedSum = 0;

  diplomaData.forEach((detail) => {
    const yearWeight = parseFloat(detail.year_weight.replace(',', '.')) || 0;
    const yearGrade = parseFloat(detail.year_grade.replace(',', '.')) || 0;
    const examWeight = parseFloat(detail.exam_weight.replace(',', '.')) || 0;
    const examGrade = parseFloat(detail.exam_grade.replace(',', '.')) || 0;

    totalWeight += yearWeight + examWeight;
    weightedSum += yearWeight * yearGrade + examWeight * examGrade;
  });

  return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '-';
}

export default Diploma;
