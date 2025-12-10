import { db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { format, isSameDay } from "date-fns";
import { X, Clock, Calendar } from "lucide-react";
import { cn } from "../lib/utils";
import { useEffect, useRef } from "react";

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const sessions = useLiveQuery(() => db.sessions.toArray());
    const tags = useLiveQuery(() => db.tags.toArray());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';

        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const todaySessions = sessions?.filter(s => isSameDay(new Date(s.startTime), new Date()))
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()) || [];

    const totalMinutes = Math.round(todaySessions.reduce((acc, s) => acc + (s.type === 'work' ? s.duration : 0), 0) / 60);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <h2 className="font-semibold">Today's Activity</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-secondary rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground bg-secondary/30 p-2 rounded-lg">
                        <span>Total Focus Time</span>
                        <span className="font-medium text-foreground">{totalMinutes} mins</span>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                        {todaySessions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No activity recorded today.
                            </div>
                        ) : (
                            todaySessions.map(session => {
                                const tag = tags?.find(t => t.id === session.tagId);
                                return (
                                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-secondary/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-1.5 h-8 rounded-full",
                                                session.type === 'break' ? "bg-secondary" : ""
                                            )}
                                                style={{ backgroundColor: session.type === 'work' ? (tag?.color || '#94a3b8') : undefined }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {session.type === 'break' ? 'Break' : (tag?.name || 'Untagged')}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(session.startTime, 'HH:mm')} - {format(session.endTime, 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium">
                                            {Math.round(session.duration / 60)}m
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
