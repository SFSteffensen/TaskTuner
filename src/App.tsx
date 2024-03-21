import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");
  const [schoolList, setSchoolList] = createSignal<Map<string, string>>(new Map());
  const [selectedSchoolId, setSelectedSchoolId] = createSignal(""); // Signal for storing the selected school ID
  const [showDropdown, setShowDropdown] = createSignal(false);
  const [loginStatus, setLoginStatus] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name: name() }));
  }

  async function fetchSchools() {
    const schools = await invoke('get_schools');
    const schoolMap = new Map(Object.entries(schools));
    setSchoolList(schoolMap);
    setShowDropdown(true);
  }

  async function login() {
    try {
      const result = await invoke('login', {
        schoolId: selectedSchoolId(),
        username: username(),
        password: password()
      });
      if (result) {
        setLoginStatus("Login Successful!");
        // Proceed with fetching other user-specific data here
      } else {
        setLoginStatus("Login Failed. Please check your credentials.");
      }
    } catch (error) {
      console.error(error);
      setLoginStatus("Login Failed. Please try again.");
    }
  }

  return (
    <div class="flex min-h-screen flex-col justify-center gap-6 text-center dark:bg-neutral-800 dark:text-neutral-200">
      <h1 class="text-center text-4xl font-semibold text-neutral-50">Quantum</h1>

      <p class="terxt-3xl p-6 text-neutral-300">Tauri running Solid even on mobile 🤯</p>

      <button class="text-md rounded-md p-4 bg-neutral-900 text-neutral-200" onClick={() => fetchSchools()}>Get School List</button>
      {showDropdown() && (
        <select onChange={(e) => setSelectedSchoolId(e.currentTarget.value)}> {/* Ensure the selected school ID is updated */}
          {Array.from(schoolList()).map(([key, value]) => (
            <option value={key}>{value}</option>
          ))}
        </select>
      )}

      <input
        type="text"
        class="rounded-md p-4 bg-neutral-900 text-neutral-200"
        placeholder="Username"
        onInput={(e) => setUsername(e.currentTarget.value)}
      />
      <input
        type="password"
        class="rounded-md p-4 bg-neutral-900 text-neutral-200"
        placeholder="Password"
        onInput={(e) => setPassword(e.currentTarget.value)}
      />

      <button class="text-md rounded-md p-4 bg-neutral-900 text-neutral-200" onClick={() => login()}>Login</button>
      <p>{loginStatus()}</p> {/* Display the login status */}
    </div>
  );
}

export default App;
