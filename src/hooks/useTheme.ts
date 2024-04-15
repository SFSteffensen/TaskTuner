import { createSignal, onCleanup } from 'solid-js';

function useTheme(defaultTheme = 'light') {
  const [theme, setTheme] = createSignal(localStorage.getItem('theme') || defaultTheme);

  // Function to change theme
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Effect to initialize the theme on component mount
  onCleanup(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
  });

  return [theme, changeTheme];
}

export default useTheme;
