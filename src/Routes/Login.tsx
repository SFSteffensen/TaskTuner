import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal, onMount } from "solid-js";
import useTheme from "../hooks/useTheme";
import fuzzysort from "fuzzysort"; // Import the fuzzysort library

function Login() {
  const [schoolList, setSchoolList] = createSignal<Map<string, string>>(
    new Map(),
  );
  const [selectedSchoolId, setSelectedSchoolId] = createSignal("");
  const [selectedSchoolName, setSelectedSchoolName] =
    createSignal("Select School");
  const [dropdownOpen, setDropdownOpen] = createSignal(false);
  const [loginStatus, setLoginStatus] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [searchTerm, setSearchTerm] = createSignal("");
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [theme, setTheme] = useTheme();

  const selectSchool = (id: string, name: string) => {
    setSelectedSchoolId(id);
    localStorage.setItem("selectedSchoolId", id);
    setSelectedSchoolName(name);
    setSearchTerm(name); // Set the searchTerm to the selected school name
    setDropdownOpen(false);
  };

  async function fetchSchools() {
    const schools = await invoke("get_schools");
    const schoolMap = new Map(Object.entries(schools));
    setSchoolList(schoolMap);
  }

  async function login() {
    if (!selectedSchoolId() || !username() || !password()) {
      setLoginStatus("Please fill in all fields.");
      return;
    }
    try {
      const response = await invoke("login", {
        schoolId: selectedSchoolId(),
        username: username(),
        password: password(),
      });
      const responseData = JSON.parse(response);

      if (responseData.status === "success") {
        setLoginStatus("Login Successful!");
        setIsLoggedIn(true);
        window.location.href = "/";
      } else {
        setLoginStatus(
          responseData.message || "Login failed. Please try again.",
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginStatus("An unexpected error occurred. Please try again.");
    }
  }

  function filteredSchoolList() {
    const results = fuzzysort.go(
      searchTerm(),
      Array.from(schoolList()).map(([id, name]) => ({ id, name })),
      {
        key: "name",
      },
    );
    return results.map((result) => [result.obj.id, result.obj.name]);
  }

  onMount(() => {
    document.documentElement.setAttribute("data-theme", theme());
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

        <div class="flex flex-row space-between items-center mt-4 max-w-sm">
          <div
            class="dropdown dropdown-end"
            tabIndex={0}
            onBlur={() => setDropdownOpen(false)}
          >
            <input
              type="text"
              class="btn m-1 text-left"
              value={searchTerm()}
              placeholder={selectedSchoolName()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              onMouseDown={() => setDropdownOpen(!dropdownOpen())}
            />
            <ul
              class={`dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10 absolute overflow-y-auto max-h-[200px] ${dropdownOpen() ? "block" : "hidden"}`}
              onMouseDown={(e) => e.stopPropagation()} // Prevent onBlur when clicking within the dropdown
              tabIndex={0}
            >
              {filteredSchoolList().map(([id, name]) => (
                <li key={id}>
                  <a
                    onMouseDown={() => {
                      selectSchool(id, name);
                      setSearchTerm("");
                    }}
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <button class="btn btn-square" onMouseDown={fetchSchools}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.944 12.979c-.489 4.509-4.306 8.021-8.944 8.021-2.698 0-5.112-1.194-6.763-3.075l1.245-1.633c1.283 1.645 3.276 2.708 5.518 2.708 3.526 0 6.444-2.624 6.923-6.021h-2.923l4-5.25 4 5.25h-3.056zm-15.864-1.979c.487-3.387 3.4-6 6.92-6 2.237 0 4.228 1.059 5.51 2.698l1.244-1.632c-1.65-1.876-4.061-3.066-6.754-3.066-4.632 0-8.443 3.501-8.941 8h-3.059l4 5.25 4-5.25h-2.92z" />
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
              required
            />
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
              required
            />
          </div>
          <div class="form-control mt-6">
            <button
              type="button"
              class="btn btn-primary btn-outline"
              onMouseDown={login}
              disabled={!username() || !password() || !selectedSchoolId()}
            >
              Login
            </button>
          </div>
          {loginStatus() && (
            <div class="form-control">
              <div class="alert alert-info shadow-lg mt-4">
                <div>
                  <span>{loginStatus()}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;
