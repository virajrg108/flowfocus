import { db } from "../lib/db";
import { Trash2, AlertTriangle, Plus, X, Pencil, Check } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useTimerStore } from "../store/useTimerStore";

const TAG_COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#64748b', // slate-500
];

export default function SettingsPage() {
    const tags = useLiveQuery(() => db.tags.toArray());
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [editingTagId, setEditingTagId] = useState<number | null>(null);
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

    const clearData = async () => {
        if (confirm("Are you sure you want to delete all tasks and stats? This cannot be undone.")) {
            await db.delete();
            await db.open();
            alert("Data cleared.");
            window.location.reload();
        }
    };

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        if ((tags?.length || 0) >= 5) {
            alert("You can only have up to 5 tags.");
            return;
        }

        try {
            await db.tags.add({
                name: newTagName.trim(),
                color: newTagColor
            });
            setNewTagName("");
            setIsAddingTag(false);
        } catch (e) {
            console.error("Failed to add tag", e);
        }
    };

    const handleUpdateTag = async (id: number) => {
        if (!newTagName.trim()) return;
        try {
            await db.tags.update(id, {
                name: newTagName.trim(),
                color: newTagColor
            });
            setEditingTagId(null);
            setNewTagName("");
        } catch (e) {
            console.error("Failed to update tag", e);
        }
    };

    const handleDeleteTag = async (id: number) => {
        if (confirm("Delete this tag? Sessions associated with it will keep the tag ID but the tag details will be lost.")) {
            await db.tags.delete(id);
        }
    };

    const startEditing = (tag: { id: number, name: string, color: string }) => {
        setEditingTagId(tag.id);
        setNewTagName(tag.name);
        setNewTagColor(tag.color);
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 pb-12">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your preferences and data.</p>
            </div>

            {/* Tag Management Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Tags</h2>
                    <span className="text-sm text-muted-foreground">{(tags?.length || 0)}/5</span>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                    {tags?.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/20 group">
                            {editingTagId === tag.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="flex gap-1">
                                        {TAG_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setNewTagColor(c)}
                                                className={cn(
                                                    "w-4 h-4 rounded-full transition-transform hover:scale-110",
                                                    newTagColor === c ? "ring-2 ring-foreground" : ""
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        className="flex-1 bg-transparent border-b border-border focus:border-foreground outline-none px-2 py-1 text-sm"
                                        autoFocus
                                    />
                                    <button onClick={() => handleUpdateTag(tag.id)} className="p-1 hover:text-green-500"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingTagId(null)} className="p-1 hover:text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                        <span className="font-medium">{tag.name}</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditing(tag as any)} className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDeleteTag(tag.id!)} className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {tags && tags.length < 5 && !isAddingTag && (
                        <button
                            onClick={() => {
                                setIsAddingTag(true);
                                setNewTagName("");
                                setNewTagColor(TAG_COLORS[0]);
                            }}
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium px-2 py-1"
                        >
                            <Plus className="w-4 h-4" /> Add Tag
                        </button>
                    )}

                    {isAddingTag && (
                        <div className="flex items-center gap-2 bg-secondary/10 p-2 rounded-md border border-border/50 animate-in fade-in slide-in-from-top-1">
                            <div className="flex gap-1">
                                {TAG_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewTagColor(c)}
                                        className={cn(
                                            "w-3 h-3 rounded-full transition-transform hover:scale-110",
                                            newTagColor === c ? "ring-2 ring-foreground" : ""
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                            <input
                                placeholder="Tag Name"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                className="flex-1 bg-transparent border-b border-border focus:border-foreground outline-none px-2 py-1 text-sm"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                            <button onClick={handleAddTag} className="p-1 hover:text-green-500"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setIsAddingTag(false)} className="p-1 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>

                {/* Flowmodoro Settings Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Timer Settings</h2>
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Flowmodoro Break Ratio</label>
                            <p className="text-xs text-muted-foreground">
                                For every N minutes of focus, you get 1 minute of break.
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">1 :</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={useTimerStore(state => state.flowmodoroRatio)}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val > 0) {
                                            useTimerStore.getState().setFlowmodoroRatio(val);
                                        }
                                    }}
                                    className="w-20 bg-transparent border-b border-border focus:border-foreground outline-none px-2 py-1 text-sm text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>
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
