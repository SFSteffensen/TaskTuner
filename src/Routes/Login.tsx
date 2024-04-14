import { invoke } from '@tauri-apps/api/core';
import { createEffect, createSignal, onMount } from 'solid-js';

function Login() {
    const [schoolList, setSchoolList] = createSignal<Map<string, string>>(new Map());
    const [selectedSchoolId, setSelectedSchoolId] = createSignal('');
    const [selectedSchoolName, setSelectedSchoolName] = createSignal('Select School');
    const [dropdownOpen, setDropdownOpen] = createSignal(false);
    const [loginStatus, setLoginStatus] = createSignal('');
    const [username, setUsername] = createSignal('');
    const [password, setPassword] = createSignal('');
    const [searchTerm, setSearchTerm] = createSignal('');

    const selectSchool = (id: string, name: string) => {
        setSelectedSchoolId(id);
        localStorage.setItem('selectedSchoolId', id);
        setSelectedSchoolName(name);
        setSearchTerm(name); // Set the searchTerm to the selected school name
        setDropdownOpen(false);
    };


    async function fetchSchools() {
        const schools = await invoke('get_schools');
        const schoolMap = new Map(Object.entries(schools));
        setSchoolList(schoolMap);
    }


    async function login() {
        if (!selectedSchoolId() || !username() || !password()) {
            setLoginStatus("Please fill in all fields.");
            return;
        }
        try {
            const response = await invoke('login', {
                schoolId: selectedSchoolId(),
                username: username(),
                password: password(),
            });
            const responseData = JSON.parse(response); // assuming response is a JSON string

            if (responseData.status === "success") {

                setLoginStatus("Login Successful!");

                setIsLoggedIn(true);
                window.location.href = "/";

            } else {
                // Handle error case
                setLoginStatus(responseData.message || "Login failed. Please try again.");
            }
        } catch (error) {
            console.error("Login error:", error);
            setLoginStatus("An unexpected error occurred. Please try again.");
        }
    }

    function filteredSchoolList() {

        const term = searchTerm().toLowerCase();
        return Array.from(schoolList()).filter(([_, name]) => name.toLowerCase().includes(term));
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

      <div class="dropdown mb-72">
        <div tabindex="0" role="button" class="btn m-1">
          Theme
          <svg width="12px" height="12px" class="h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
        </div>
        <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52">
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="light" value="light" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="dark" value="dark" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="nord" value="nord" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="black" value="black" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="lofi" value="lofi" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="night" value="night" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="cyberpunk" value="cyberpunk" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="aqua" value="aqua" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="valentine" value="valentine" /></li>
          <li><input type="radio" name="theme-dropdown" class="theme-controller btn btn-sm btn-block btn-ghost justify-start" aria-label="pastel" value="pastel" /></li>
        </ul>
      </div>

      <div class="w-full max-w-md space-y-6">
        <h1 class="text-center text-4xl font-semibold">TaskTuner</h1>
        <p class="text-center text-xl">built with Tauri</p>

          <div class="flex flex-row space-between items-center mt-4 max-w-sm">
              <div class="dropdown dropdown-end" tabIndex={0} onBlur={() => setDropdownOpen(false)}>
                  <input
                      type="text"
                      class="btn m-1 text-left"
                      value={searchTerm()}
                      placeholder={selectedSchoolName()}
                      onInput={(e) => setSearchTerm(e.currentTarget.value)}
                      onClick={() => setDropdownOpen(!dropdownOpen())}
                  />
                  <ul
                      class={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10 absolute overflow-y-auto max-h-[200px] ${dropdownOpen() ? 'block' : 'hidden'}`}
                      onClick={(e) => e.stopPropagation()} // Prevent onBlur when clicking within the dropdown
                      tabIndex={0}
                  >
                      {filteredSchoolList().map(([id, name]) => (
                          <li key={id}><a onClick={() => {
                              selectSchool(id, name);
                              setSearchTerm('');
                          }}>{name}</a></li>
                      ))}
                  </ul>
              </div>

              <button class="btn btn-square"
                      onClick={fetchSchools}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill='currentColor'
                       viewBox="0 0 24 24">
                      <path
                          d="M20.944 12.979c-.489 4.509-4.306 8.021-8.944 8.021-2.698 0-5.112-1.194-6.763-3.075l1.245-1.633c1.283 1.645 3.276 2.708 5.518 2.708 3.526 0 6.444-2.624 6.923-6.021h-2.923l4-5.25 4 5.25h-3.056zm-15.864-1.979c.487-3.387 3.4-6 6.92-6 2.237 0 4.228 1.059 5.51 2.698l1.244-1.632c-1.65-1.876-4.061-3.066-6.754-3.066-4.632 0-8.443 3.501-8.941 8h-3.059l4 5.25 4-5.25h-2.92z"/>
                  </svg>
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
                      required/>
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
                      required/>
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

export default Login;
