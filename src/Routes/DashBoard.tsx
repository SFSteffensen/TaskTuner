import { createSignal, For, onMount } from 'solid-js';
import { useLocation } from "@solidjs/router";
import { useStore } from "../store";
import { invoke } from '@tauri-apps/api/core';

function DashBoard() {
    const {isLoggedIn} = useStore();
    const {pathname} = useLocation();

    const [scheduleData, setScheduleData] = createSignal<any[]>([]);

    console.log(isLoggedIn())

    if (!isLoggedIn()) {
        console.log("User not logged in. Redirecting to login page.");
        window.location.href = "/login?redirect=" + pathname;
    }

    async function fetchSchedule() {
        try {
            const response = await invoke('get_schedule');
            const responseData = JSON.parse(response); // assuming response is a JSON string

            if (responseData.status === "success") {
                // Assuming responseData.schedule holds the schedule JSON string
                const scheduleJson = JSON.parse(responseData.schedule); // parse the JSON string into an object
                setScheduleData(scheduleJson); // update the state

                console.log("Schedule Data:", scheduleJson); // logging the parsed JSON
            } else {
                // Handle error case
                console.error(responseData.message || "Failed to fetch schedule.");
            }
        } catch (error) {
            console.error("Fetch schedule error:", error);
        }
    }

    onMount(fetchSchedule);

    return (
        <div>
            <h1>Dashboard</h1>

            <div>
                <table>
                    <thead>
                    <tr>
                        <th>Class Name</th>
                        <th>Teacher</th>
                        <th>Room</th>
                        <th>Description</th>
                        <th>Time</th>
                        <th>Homework</th>
                        {/* New column for homework */}
                    </tr>
                    </thead>
                    <tbody>
                    {/*<For each={scheduleData()}>
                        {(classDetail) => (
                            <tr>
                                <td>{classDetail.class_name}</td>
                                <td>{classDetail.teacher}</td>
                                <td>{classDetail.room}</td>
                                <td>{classDetail.description}</td>
                                <td>{classDetail.time}</td>
                                <td>{classDetail.homework}</td>
                                 Displaying homework data
                            </tr>
                        )}
                    </For>*/}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

export default DashBoard;
