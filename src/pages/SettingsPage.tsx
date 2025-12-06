import { db } from "../lib/db";
import { Trash2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
    const clearData = async () => {
        if (confirm("Are you sure you want to delete all tasks and stats? This cannot be undone.")) {
            await db.delete();
            await db.open();
            alert("Data cleared.");
            window.location.reload();
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your preferences and data.</p>
            </div>

            <div className="bg-card border border-destructive/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-destructive font-medium">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Danger Zone</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Clear all your tasks and session history. This action is irreversible.
                </p>
                <button
                    onClick={clearData}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors text-sm font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear All Data
                </button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-8">
                FlowFocus v1.0.0
            </div>
        </div>
    );
}
