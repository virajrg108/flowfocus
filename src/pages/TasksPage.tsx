import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { Plus, Trash2, Check } from "lucide-react";
import { cn } from "../lib/utils";

export default function TasksPage() {
    const tasks = useLiveQuery(() => db.tasks.toArray());
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            await db.tasks.add({
                title: newTaskTitle,
                isCompleted: false,
                createdAt: new Date(),
            });
            setNewTaskTitle("");
        } catch (error) {
            console.error("Failed to add task:", error);
        }
    };

    const toggleTask = async (id: number, currentStatus: boolean) => {
        await db.tasks.update(id, { isCompleted: !currentStatus });
    };

    const deleteTask = async (id: number) => {
        await db.tasks.delete(id);
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                <p className="text-muted-foreground">Manage your focus objectives.</p>
            </div>

            <form onSubmit={addTask} className="flex gap-2">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 px-4 py-2 rounded-md bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 border-none"
                />
                <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            <div className="space-y-2">
                {tasks?.sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted) || b.id - a.id).map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "group flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-all",
                            task.isCompleted && "opacity-60 bg-secondary/20"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleTask(task.id, task.isCompleted)}
                                className={cn(
                                    "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                    task.isCompleted
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/50 hover:border-primary"
                                )}
                            >
                                {task.isCompleted ? <Check className="w-3 h-3" /> : null}
                            </button>
                            <span className={cn("text-sm", task.isCompleted && "line-through text-muted-foreground")}>
                                {task.title}
                            </span>
                        </div>
                        <button
                            onClick={() => deleteTask(task.id)}
                            className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {tasks?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                        No tasks yet. Add one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
