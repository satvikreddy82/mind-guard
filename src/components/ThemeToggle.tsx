import { useEffect } from 'react';

export default function ThemeToggle() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('mindguard_theme', 'light');
  }, []);
  return null;
}
