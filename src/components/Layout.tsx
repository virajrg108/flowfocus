import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { Timer, ListTodo, BarChart2, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function Layout() {
    const location = useLocation();

    const navItems = [
        { path: "/", icon: Timer, label: "Timer" },
        { path: "/tasks", icon: ListTodo, label: "Tasks" },
        { path: "/stats", icon: BarChart2, label: "Stats" },
        { path: "/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
            <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-14 max-w-screen-2xl items-center px-4">
                    <div className="mr-8 flex items-center space-x-2">
                        <span className="font-bold text-xl bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                            FlowFocus
                        </span>
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-4">
                        <nav className="flex items-center space-x-2 lg:space-x-6 text-sm font-medium">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            "transition-colors hover:text-foreground/80 flex items-center gap-2 px-2 py-1 rounded-md",
                                            isActive
                                                ? "text-foreground bg-secondary/50"
                                                : "text-foreground/60 hover:bg-secondary/20"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden sm:inline-block">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="w-px h-6 bg-border/50 mx-2" />
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className="flex-1 container max-w-screen-md mx-auto py-6 px-4">
                <Outlet />
            </main>
        </div>
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
