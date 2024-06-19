import { createSignal, onMount, onCleanup } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import useTheme from '../hooks/useTheme';

function Assignments() {
    const [assignments, setAssignments] = createSignal([]);
    const [filter, setFilter] = createSignal('Venter');
    const [sortBy, setSortBy] = createSignal('deadline');
    const schoolId = localStorage.getItem('selectedSchoolId') || '';
    const [theme] = useTheme();

    const fetchAssignments = async () => {
        try {
            const response = await invoke('get_assignments', { schoolId });
            setAssignments(JSON.parse(response));
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        }
    };

    onMount(() => {
        document.documentElement.setAttribute('data-theme', theme());
        fetchAssignments(); // Initial fetch
        const interval = setInterval(fetchAssignments, 60000); // Fetch every minute
        onCleanup(() => clearInterval(interval)); // Clear interval on component unmount
    });

    function parseEuropeanDate(dateStr) {
        const parts = dateStr.split('/');
        return new Date(`${parts[2]}/${parts[1]}/${parts[0]}`); // Adjusts to mm/dd/yyyy for JavaScript compatibility
    }

    function formatDateString(dateStr) {
        const regex = /(\d{1,2})\/(\d{1,2})-(\d{4})/;
        return dateStr.replace(
            regex,
            (match, day, month, year) =>
                `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
        );
    }

    const filteredAssignments = () => {
        return assignments()
            .filter((assignment) => {
                return filter() === 'Both' || assignment.status === filter();
            })
            .sort((a, b) => {
                switch (sortBy()) {
                    case 'student_time':
                        return b.student_time - a.student_time; // Already a float, no need to parse
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
        <div class="overflow-x-auto p-4 pb-16">
            <h1 class="text-2xl font-bold mb-4">Assignments</h1>
            <div class="flex justify-center gap-4 mb-4">
                {' '}
                {/* Centering selects horizontally */}
                <select
                    class="select select-bordered"
                    onInput={(e) => setFilter(e.currentTarget.value)}
                >
                    <option value="Venter">Venter</option>
                    <option value="Afleveret">Afleveret</option>
                    <option value="Both">Both</option>
                </select>
                <select
                    class="select select-bordered"
                    onInput={(e) => setSortBy(e.currentTarget.value)}
                >
                    <option value="deadline">Afleveringsfrist</option>
                    <option value="student_time">Elevtimer</option>
                    <option value="urgency">Haster Score</option>
                </select>
            </div>
            <div class="w-full mt-4">
                <table class="table w-full table-compact table-fixed">
                    <thead>
                        <tr>
                            <th>
                                <div
                                    class="tooltip tooltip-right"
                                    data-tip="Opgavens Navn"
                                >
                                    Titel
                                </div>
                            </th>
                            <th>
                                <div
                                    class="tooltip"
                                    data-tip="Hvornår Opgaven skal afleveres"
                                >
                                    Afleveringsfrist
                                </div>
                            </th>
                            <th>
                                <div
                                    class="tooltip"
                                    data-tip="Mængden af Elevtimer opgaven tæller for"
                                >
                                    Elevtimer
                                </div>
                            </th>
                            <th>
                                <div
                                    class="tooltip"
                                    data-tip="Er opgaven afleveret?"
                                >
                                    Status
                                </div>
                            </th>
                            <th>
                                <div
                                    class="tooltip tooltip-left"
                                    data-tip="Hvor Meget du bør prioritere opgaven"
                                >
                                    Haster Score
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssignments().map((assignment, index) => (
                            <tr key={index}>
                                <td class="font-bold">{assignment.title}</td>
                                <td>{formatDateString(assignment.deadline)}</td>
                                <td>{assignment.student_time.toFixed(2)}</td>
                                <td>{assignment.status}</td>
                                <td>
                                    {(assignment.urgency * 1000.0).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Assignments;
