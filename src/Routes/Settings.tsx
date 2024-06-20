import { invoke } from '@tauri-apps/api/core';
import { createEffect, createSignal, onMount } from 'solid-js';
import useTheme from '../hooks/useTheme';
import Chart from 'chart.js/auto';

function Settings() {
  const [theme, setTheme] = createSignal(
    localStorage.getItem('theme') || 'light'
  );

  const [absenceData, setAbsenceData] = createSignal({});
  const [gradesData, setGradesData] = createSignal({
    grades: [],
    grade_notes: [],
  });
  const schoolId = localStorage.getItem('selectedSchoolId') || '';

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  async function fetchAbsence() {
    try {
      const response = await invoke('get_absence', {
        schoolId: schoolId,
      });
      const data = JSON.parse(response);
      setAbsenceData(data);
      updateChart(data);
    } catch (error) {
      console.error('Failed to fetch absence data:', error);
    }
  }

  async function fetchGrades() {
    try {
      const response = await invoke('get_grades', { schoolId: schoolId });
      const data = JSON.parse(response);
      setGradesData(data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    }
  }

  function generateColors(count) {
    const backgroundColors = [];
    const borderColors = [];
    const saturation = 70;
    const lightness = 50;

    for (let i = 0; i < count; i++) {
      const hue = Math.floor((i / count) * 360);
      backgroundColors.push(
        `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`
      );
      borderColors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 1)`);
    }

    return { backgroundColors, borderColors };
  }

  console.log(generateColors(5));

  function updateChart(data) {
    const ctx = document.getElementById('myChart').getContext('2d');
    const opgjortData = [];
    const opgjortModules = [];
    const forAaretData = [];
    const forAaretModules = [];
    const labels = [];

    Object.entries(data).forEach(([team, details]) => {
      if (team !== 'Samlet') {
        labels.push(team);
        opgjortData.push(
          parseFloat(details.opgjort.procent.replace('%', ''))
        );
        opgjortModules.push(details.opgjort.moduler);
        forAaretData.push(
          parseFloat(details.for_the_year.procent.replace('%', ''))
        );
        forAaretModules.push(details.for_the_year.moduler);
      }
    });

    const { backgroundColors, borderColors } = generateColors(
      labels.length
    );

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Opgjort',
          data: opgjortData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
        {
          label: 'For Året',
          data: forAaretData,
          backgroundColor: backgroundColors.map((color) =>
            color.replace('0.7', '0.85')
          ), // Slightly darker for contrast
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };

    const tooltipCallback = {
      label: function(tooltipItem) {
        let label = chartData.labels[tooltipItem.dataIndex];
        let datasetLabel =
          chartData.datasets[tooltipItem.datasetIndex].label;
        let value =
          chartData.datasets[tooltipItem.datasetIndex].data[
          tooltipItem.dataIndex
          ];
        let modules =
          tooltipItem.datasetIndex === 0
            ? opgjortModules[tooltipItem.dataIndex]
            : forAaretModules[tooltipItem.dataIndex];
        return `${label} (${datasetLabel}): ${value}% (${modules} moduler)`;
      },
    };

    new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: false, text: '' },
          tooltip: {
            callbacks: tooltipCallback,
          },
        },
      },
    });
  }

  function calculateAverage(grades, key) {
    let totalWeight = 0;
    let weightedSum = 0;
    const logEntries = [];

    grades.forEach((grade) => {
      if (grade[key]) {
        const { grade: gradeValue, weight } = grade[key];
        const weightedGrade = parseFloat(gradeValue) * weight;
        weightedSum += weightedGrade;
        totalWeight += weight;
        logEntries.push(`(${gradeValue} * ${weight})`);
      }
    });

    const average = totalWeight > 0 ? weightedSum / totalWeight : '-';

    if (totalWeight > 0) {
      console.log(`Calculation for ${key}:`);
      console.log(logEntries.join(' + '));
      console.log(`Total Weight: ${totalWeight}`);
      console.log(`Weighted Sum: ${weightedSum}`);
      console.log(`Average: ${average}`);
    }

    return totalWeight > 0 ? average.toFixed(2) : '-';
  }

  onMount(() => {
    document.documentElement.setAttribute('data-theme', theme());
    fetchAbsence();
    fetchGrades();
  });

  return (
    <div class="overflow-x-auto p-4">
      <h1 class="text-2xl font-bold">Mere</h1>
      <div class="join join-vertical w-full pb-16">
        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">Fravær</div>

          <div class="collapse-content text-center flex flex-col items-center">
            <div class="flex flex-col md:flex-row justify-center items-start space-y-8 md:space-y-0 md:space-x-8">
              <div>
                <h2 class="text-lg font-semibold mb-4">
                  Fysisk Fravær
                </h2>
                {absenceData() && absenceData()['Samlet'] ? (
                  <div class="stats shadow">
                    <div class="stat bg-base-200">
                      <div class="stat-title">
                        Opgjort
                      </div>
                      <div class="stat-value">
                        {
                          absenceData()['Samlet']
                            .opgjort.procent
                        }
                      </div>
                      <div class="stat-desc text-secondary">
                        {
                          absenceData()['Samlet']
                            .opgjort.moduler
                        }{' '}
                        moduler
                      </div>
                    </div>
                    <div class="stat bg-base-200">
                      <div class="stat-title">
                        For Året
                      </div>
                      <div class="stat-value">
                        {
                          absenceData()['Samlet']
                            .for_the_year.procent
                        }
                      </div>
                      <div class="stat-desc text-secondary">
                        {
                          absenceData()['Samlet']
                            .for_the_year.moduler
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Loading absence data...</p>
                )}
              </div>

              <div class="flex flex-col items-center">
                <h2 class="text-lg font-semibold mb-4">
                  Skriftligt Fravær
                </h2>
                {absenceData() &&
                  absenceData()['Samlet'] &&
                  absenceData()['Samlet'].writing ? (
                  <div class="stats shadow">
                    <div class="stat bg-base-200">
                      <div class="stat-title">
                        Opgjort
                      </div>
                      <div class="stat-value">
                        {
                          absenceData()['Samlet']
                            .writing.opgjort.procent
                        }
                      </div>
                      <div class="stat-desc text-secondary">
                        {
                          absenceData()['Samlet']
                            .writing.opgjort.moduler
                        }{' '}
                        moduler
                      </div>
                    </div>
                    <div class="stat bg-base-200">
                      <div class="stat-title">
                        For Året
                      </div>
                      <div class="stat-value">
                        {
                          absenceData()['Samlet']
                            .writing
                            .for_the_year_wrting
                            .procent
                        }
                      </div>
                      <div class="stat-desc text-secondary">
                        {
                          absenceData()['Samlet']
                            .writing
                            .for_the_year_wrting
                            .moduler
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Loading written absence data...</p>
                )}
              </div>
            </div>
            <div class="relative lg:w-full lg:max-w-sm xl:w-full xl:max-w-sm mx-auto pt-4 pb-4 flex flex-col items-center">
              <canvas id="myChart"></canvas>
            </div>

            <div class="hidden md:block md:content-center">
              {absenceData() && (
                <div class="stats shadow bg-base-200">
                  {Object.entries(absenceData()).map(
                    ([team, details]) => {
                      if (team !== 'Samlet') {
                        return (
                          <div
                            class="stat place-items-center"
                            key={team}
                          >
                            <div class="stat-title">
                              {team}
                            </div>
                            <div class="stat-value">
                              {
                                details.opgjort
                                  .procent
                              }
                            </div>
                            <div class="stat-desc text-secondary">
                              {
                                details.opgjort
                                  .moduler
                              }
                            </div>
                            <div class="stat-value">
                              {
                                details
                                  .for_the_year
                                  .procent
                              }
                            </div>
                            <div class="stat-desc text-secondary">
                              {
                                details
                                  .for_the_year
                                  .moduler
                              }
                            </div>
                          </div>
                        );
                      }
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">
            Dokumenter
          </div>
          <div class="collapse-content">
            <p>Dokumenter kommer senere</p>
          </div>
        </div>

        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">
            Karakterer
          </div>
          <div class="collapse-content">
            <button class='btn btn-primary' onMouseDown={() => window.location.href = '/Diploma'}>Se Diplom</button>
            {gradesData().grades.length > 0 ? (
              <table class="table table-xs md:table-sm lg:table-md xl:table-lg w-full table-compact table-fixed whitespace-normal">
                <thead class="whitespace-normal">
                  <tr>
                    <th>Fag</th>
                    <th>1.standpunkt</th>
                    <th>2.standpunkt</th>
                    <th>Årskarakter</th>
                    <th class="hidden md:table-cell">
                      Intern prøve
                    </th>
                    <th>Eksamens-/Årsprøvekarakter</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesData().grades.map((grade, index) => (
                    <tr key={index}>
                      <td>{grade.subject}</td>
                      <td>
                        {cleanGradeText(
                          grade.first_standpoint
                            ?.grade
                        ) || '-'}
                        {grade.first_standpoint
                          ?.weight && (
                            <div class="text-xs opacity-50">
                              {
                                grade
                                  .first_standpoint
                                  .weight
                              }
                            </div>
                          )}
                      </td>
                      <td>
                        {cleanGradeText(
                          grade.second_standpoint
                            ?.grade
                        ) || '-'}
                        {grade.second_standpoint
                          ?.weight && (
                            <div class="text-xs opacity-50">
                              {
                                grade
                                  .second_standpoint
                                  .weight
                              }
                            </div>
                          )}
                      </td>
                      <td>
                        {cleanGradeText(
                          grade.final_year_grade
                            ?.grade
                        ) || '-'}
                        {grade.final_year_grade
                          ?.weight && (
                            <div class="text-xs opacity-50">
                              {
                                grade
                                  .final_year_grade
                                  .weight
                              }
                            </div>
                          )}
                      </td>
                      <td class="hidden md:table-cell">
                        {cleanGradeText(
                          grade.internal_exam?.grade
                        ) || '-'}
                        {grade.internal_exam
                          ?.weight && (
                            <div class="text-xs opacity-50">
                              {
                                grade.internal_exam
                                  .weight
                              }
                            </div>
                          )}
                      </td>
                      <td>
                        {cleanGradeText(
                          grade.final_exam?.grade
                        ) || '-'}
                        {grade.final_exam?.weight && (
                          <div class="text-xs opacity-50">
                            {
                              grade.final_exam
                                .weight
                            }
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Vægtet gennemsnit</td>
                    <td>
                      {calculateAverage(
                        gradesData().grades,
                        'first_standpoint'
                      )}
                    </td>
                    <td>
                      {calculateAverage(
                        gradesData().grades,
                        'second_standpoint'
                      )}
                    </td>
                    <td>
                      {calculateAverage(
                        gradesData().grades,
                        'final_year_grade'
                      )}
                    </td>
                    <td class="hidden md:table-cell">
                      {calculateAverage(
                        gradesData().grades,
                        'internal_exam'
                      )}
                    </td>
                    <td>
                      {calculateAverage(
                        gradesData().grades,
                        'final_exam'
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p>Loading grades data...</p>
            )}
          </div>
        </div>

        <div class="collapse collapse-arrow join-item border border-base-300">
          <input type="radio" name="my-accordion-1" />
          <div class="collapse-title text-xl font-medium">Tema</div>
          <div class="collapse-content">
            <div>
              {[
                'light',
                'dark',
                'darkCyber',
                'nord',
                'retro',
                'black',
                'lofi',
                'night',
                'cyberpunk',
                'aqua',
                'valentine',
                'pastel',
              ].map((t) => (
                <div class="form-control">
                  <label class="label cursor-pointer gap-4">
                    <span class="label-text">
                      {t.charAt(0).toUpperCase() +
                        t.slice(1)}
                    </span>
                    <input
                      type="radio"
                      name="theme-radios"
                      class="radio theme-controller"
                      value={t}
                      checked={theme() === t}
                      onChange={(e) =>
                        changeTheme(
                          e.currentTarget.value
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

// Helper function to clean grade text
function cleanGradeText(text) {
  return text?.replace(/vægt:\s*\d+(\.\d+)?/, '').trim();
}
