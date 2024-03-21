import { createEffect, createSignal, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

function App() {
  const [schoolList, setSchoolList] = createSignal<Map<string, string>>(new Map());
  const [selectedSchoolId, setSelectedSchoolId] = createSignal('');
  const [selectedSchoolName, setSelectedSchoolName] = createSignal('Select School');
  const [dropdownOpen, setDropdownOpen] = createSignal(false);
  const [loginStatus, setLoginStatus] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const isLoginDisabled = () => {
    // Debug: Log the current state values to verify they're being updated correctly
    console.log(`Username: ${username()}, Password: ${password()}, School ID: ${selectedSchoolId()}`);
    return !username() || !password() || !selectedSchoolId();
  };
  const selectSchool = (id: string, name: string) => {
    setSelectedSchoolId(id);
    setSelectedSchoolName(name);
    setDropdownOpen(false);
  };
  const [searchTerm, setSearchTerm] = createSignal("");
  const handleKeyDown = (e) => {
    // Append the typed character to the search term
    setSearchTerm((prev) => prev + e.key.toLowerCase());

    // Find the first school name that starts with the search term
    const schoolEntry = Array.from(schoolList()).find(([_, name]) =>
      name.toLowerCase().startsWith(searchTerm())
    );

    if (schoolEntry) {
      const [id, name] = schoolEntry;
      selectSchool(id, name); // Use your existing selectSchool function
    }

    // Clear the search term after a delay
    setTimeout(() => setSearchTerm(""), 1000); // Reset after 1 second of inactivity
  };


  async function fetchSchools() {
    const schools = await invoke('get_schools');
    const schoolMap = new Map(Object.entries(schools));
    setSchoolList(schoolMap);
  }

  async function login() {
    try {
      const result = await invoke('login', {
        schoolId: selectedSchoolId(),
        username: username(),
        password: password(),
      });
      setLoginStatus(result ? 'Login Successful!' : 'Login Failed. Please check your credentials.');
    } catch (error) {
      console.error(error);
      setLoginStatus('Login Failed. Please try again.');
    }
  }

  onMount(() => {
    fetchSchools();
  });

  createEffect(() => {
    const school = schoolList().get(selectedSchoolId());
    if (school) {
      setSelectedSchoolName(school);
    }
  });

  return (
    <div class="flex min-h-screen items-center justify-center p-4 bg-base-100 text-primary">
      <div class="w-full max-w-md space-y-6">
        <h1 class="text-center text-4xl font-semibold">TaskTuner</h1>
        <p class="text-center text-xl">built with Tauri</p>

        <div class="flex items-center mt-4">

          <div class="dropdown dropdown-end" tabIndex={0} onBlur={() => setDropdownOpen(false)}>
            <div
              tabIndex={0}
              class="btn m-1"
              onClick={() => setDropdownOpen(!dropdownOpen())}
            >
              {selectedSchoolName()}
            </div>
            <ul
              class={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10 absolute overflow-y-auto max-h-[200px] ${dropdownOpen() ? 'block' : 'hidden'}`}
              onClick={(e) => e.stopPropagation()} // Prevent onBlur when clicking within the dropdown
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {Array.from(schoolList()).map(([id, name]) => (
                <li key={id}><a onClick={() => selectSchool(id, name)}>{name}</a></li>
              ))}
            </ul>
          </div>

          <button class="btn btn-square"
            onClick={fetchSchools}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill='currentColor' viewBox="0 0 24 24"><path d="M20.944 12.979c-.489 4.509-4.306 8.021-8.944 8.021-2.698 0-5.112-1.194-6.763-3.075l1.245-1.633c1.283 1.645 3.276 2.708 5.518 2.708 3.526 0 6.444-2.624 6.923-6.021h-2.923l4-5.25 4 5.25h-3.056zm-15.864-1.979c.487-3.387 3.4-6 6.92-6 2.237 0 4.228 1.059 5.51 2.698l1.244-1.632c-1.65-1.876-4.061-3.066-6.754-3.066-4.632 0-8.443 3.501-8.941 8h-3.059l4 5.25 4-5.25h-2.92z" /></svg>
          </button>

        </div>
        <form class="card w-full max-w-sm bg-base-200 shadow-xl p-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Username</span>
            </label>
            <input
              type="text"
              placeholder="Username"
              class="input input-bordered"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              required />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="Password"
              class="input input-bordered"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required />
          </div>
          <div class="form-control mt-6">
            <button
              type="button"
              class="btn btn-primary btn-outline"
              onClick={login}
              disabled={!username() || !password() || !selectedSchoolId()}>
              Login
            </button>
          </div>
          {loginStatus() && <div class="form-control">
            <div class="alert alert-info shadow-lg mt-4">
              <div>
                <span>{loginStatus()}</span>
              </div>
            </div>
          </div>}
        </form>
      </div>
    </div>
  );
}

export default App;
