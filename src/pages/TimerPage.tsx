import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTimerStore } from "../store/useTimerStore";
import { Play, Pause, Square, Coffee, Brain, Pencil, Check, Tag as TagIcon, ChevronDown, History, PictureInPicture2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import HistoryModal from "../components/HistoryModal";
import { useDocumentPiP } from "../hooks/useDocumentPiP";

export default function TimerPage() {
    const playChime = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.5);
    };
    const {
        status, mode, startTime, accumulatedTime,
        timerType, pomodoroDuration, earnedBreakTime, selectedTagId,
        start, pause, stop, skipBreak, setMode, setTimerType, setPomodoroDuration, setTagId
    } = useTimerStore();

    const tags = useLiveQuery(() => db.tags.toArray());

    const [displayTime, setDisplayTime] = useState(0);
    const [isEditingPomo, setIsEditingPomo] = useState(false);
    const [pomoInput, setPomoInput] = useState(pomodoroDuration.toString());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const flowmodoroRatio = useTimerStore(state => state.flowmodoroRatio);

    const { isSupported, pipWindow, requestPiP, closePiP } = useDocumentPiP();

    const togglePiP = async () => {
        if (pipWindow) {
            closePiP();
        } else {
            // Requesting a small window for the timer
            await requestPiP(300, 200);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync input with store
    useEffect(() => {
        setPomoInput(pomodoroDuration.toString());
    }, [pomodoroDuration]);

    // Update loop
    useEffect(() => {
        let interval: number;

        const updateTimer = () => {
            const now = Date.now();
            const currentRun = (status === 'running' && startTime) ? (now - startTime) / 1000 : 0;
            const totalElapsed = accumulatedTime + currentRun;

            if (timerType === 'flowmodoro') {
                if (mode === 'focus') {
                    // Focus: Count Up
                    setDisplayTime(totalElapsed);
                } else {
                    // Break: Count Down from Earned Time
                    const remaining = Math.max(0, earnedBreakTime - totalElapsed);
                    setDisplayTime(remaining);

                    if (remaining === 0 && status === 'running') {
                        playChime();
                        stop().then(() => setMode('focus'));
                    }
                }
            } else {
                // Pomodoro Logic
                let targetParams = pomodoroDuration * 60;
                if (mode === 'break') targetParams = (pomodoroDuration * 60) / flowmodoroRatio;

                const remaining = Math.max(0, targetParams - totalElapsed);
                setDisplayTime(remaining);

                if (remaining === 0 && status === 'running') {
                    playChime();
                    stop().then(() => {
                        // Auto switch modes: Break -> Focus, Focus -> Break
                        if (mode === 'break') {
                            setMode('focus');
                        } else if (mode === 'focus') {
                            setMode('break');
                        }
                    });
                }
            }
        };

        if (status === 'running') {
            interval = setInterval(updateTimer, 100) as unknown as number;
        } else {
            updateTimer();
        }
        return () => clearInterval(interval);
    }, [status, startTime, accumulatedTime, timerType, pomodoroDuration, earnedBreakTime, mode, stop, setMode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSavePomoDuration = () => {
        const val = parseInt(pomoInput);
        if (!isNaN(val) && val > 0) {
            setPomodoroDuration(val);
            setIsEditingPomo(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto">
            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

            <div className="w-full max-w-lg flex flex-col relative">
                <div className="flex justify-between">
                    {/* PiP Toggle */}
                    {isSupported && (
                        <button
                            onClick={togglePiP}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium"
                            title={pipWindow ? "Restore Timer" : "Pop out Timer"}
                        >
                            <PictureInPicture2 className="w-4 h-4" />
                            <span>{pipWindow ? "Restore" : "Pop out"}</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium"
                        title="View History"
                    >
                        <History className="w-4 h-4" />
                        <span>Today's Activity</span>
                    </button>
                </div>
                {/* Tabs (Outside Card - Top) */}
                <div className="grid grid-cols-2 p-1 bg-muted/50 rounded-t-xl border-t border-x border-border">
                    <button
                        onClick={() => setTimerType('flowmodoro')}
                        className={cn(
                            "py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-center",
                            timerType === 'flowmodoro'
                                ? "bg-background shadow-sm text-foreground scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        Flowtime
                    </button>
                    <button
                        onClick={() => setTimerType('pomodoro')}
                        className={cn(
                            "py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-center",
                            timerType === 'pomodoro'
                                ? "bg-background shadow-sm text-foreground scale-[1.02]"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        Pomodoro
                    </button>
                </div>

                {/* Timer Card (Bottom) */}
                {pipWindow && (
                    <div className="w-full bg-card/50 border border-dashed border-border rounded-b-2xl rounded-t-none p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <PictureInPicture2 className="w-12 h-12 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground font-medium">Timer is popped out</p>
                        <button onClick={closePiP} className="text-primary hover:underline text-sm">Bring back</button>
                    </div>
                )}

                {(() => {
                    const content = (
                        <div className={cn(
                            "flex flex-col items-center w-full bg-card border border-border rounded-b-2xl shadow-2xl shadow-black/40",
                            // Style adjustments for PiP vs Main
                            !pipWindow && "rounded-t-none p-6", // Normal mode
                            pipWindow && "h-full justify-center rounded-none border-none shadow-none p-2 space-y-2" // PiP Mode
                        )}>

                            {/* Mode Toggle (Focus/Break) */}
                            <div className={cn("flex items-center gap-4 bg-secondary/50 rounded-full", pipWindow ? "p-1 scale-90" : "p-1.5")}>
                                <button
                                    onClick={() => setMode('focus')}
                                    className={cn(
                                        "rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                                        pipWindow ? "px-3 py-1 text-xs" : "px-5 py-1.5",
                                        mode === 'focus' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Brain className={cn(pipWindow ? "w-3 h-3" : "w-4 h-4")} />
                                    Focus
                                </button>
                                <button
                                    onClick={() => setMode('break')}
                                    className={cn(
                                        "rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                                        pipWindow ? "px-3 py-1 text-xs" : "px-5 py-1.5",
                                        mode === 'break' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Coffee className={cn(pipWindow ? "w-3 h-3" : "w-4 h-4")} />
                                    Break
                                </button>
                            </div>

                            {/* Tag Selector (Chakra Style) */}
                            {mode === 'focus' && (
                                <div className="relative z-20 flex items-center justify-center gap-2 mt-4">
                                    {status === 'idle' && accumulatedTime === 0 ? (
                                        <>
                                            <div className="relative" ref={dropdownRef}>
                                                <button
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-md text-sm font-medium shadow-sm hover:bg-secondary/50 transition-colors"
                                                >
                                                    <TagIcon className="w-4 h-4 text-muted-foreground" />
                                                    <span>
                                                        {selectedTagId
                                                            ? tags?.find(t => t.id === selectedTagId)?.name
                                                            : "Select Tag"
                                                        }
                                                    </span>
                                                    {selectedTagId && tags?.find(t => t.id === selectedTagId) && (
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: tags?.find(t => t.id === selectedTagId)?.color }}
                                                        />
                                                    )}
                                                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
                                                </button>

                                                {isDropdownOpen && (
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg py-1 animate-in fade-in zoom-in-95 duration-100 z-50">
                                                        <button
                                                            onClick={() => {
                                                                setTagId(null);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors"
                                                        >
                                                            No Tag
                                                        </button>
                                                        {tags?.map(tag => (
                                                            <button
                                                                key={tag.id}
                                                                onClick={() => {
                                                                    setTagId(tag.id);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-2"
                                                            >
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                                                {tag.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Link
                                                to="/settings"
                                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                                                title="Manage Tags"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                        </>
                                    ) : (
                                        // Read-only view during focus (or break if visible, but mode===focus check wraps this)
                                        selectedTagId && tags?.find(t => t.id === selectedTagId) && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-secondary/30 rounded-full text-sm border border-transparent">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: tags.find(t => t.id === selectedTagId)?.color }}
                                                />
                                                <span className="font-medium">{tags.find(t => t.id === selectedTagId)?.name}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Timer Display */}
                            <div className="relative group text-center pb-4 flex items-center flex-col">
                                <div className={cn(
                                    "leading-none font-medium tabular-nums tracking-tighter select-none transition-colors",
                                    pipWindow ? "text-6xl" : "text-[100px]",
                                    mode === 'focus' ? "text-focus" : "text-break"
                                )}>
                                    {formatTime(displayTime)}
                                </div>

                                {/* Flowmodoro Info */}
                                {timerType === 'flowmodoro' && mode === 'focus' && status !== 'idle' && (
                                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                                        Break earned: {formatTime(Math.floor(displayTime / flowmodoroRatio))}
                                    </div>
                                )}
                                {timerType === 'flowmodoro' && mode === 'break' && (
                                    <div className=" flex flex-col items-center gap-2">
                                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                                            Total Break: {formatTime(earnedBreakTime)}
                                        </div>
                                        <button
                                            onClick={() => skipBreak()}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Skip Break
                                        </button>
                                    </div>
                                )}

                                {/* Pomodoro Edit Controls */}
                                {timerType === 'pomodoro' && mode === 'focus' && status === 'idle' && (
                                    <div className="flex items-center gap-2">
                                        {isEditingPomo ? (
                                            <div className="flex items-center gap-2 bg-popover border border-border rounded-md p-1 shadow-sm">
                                                <input
                                                    type="number"
                                                    value={pomoInput}
                                                    onChange={(e) => setPomoInput(e.target.value)}
                                                    className="w-16 bg-transparent text-center font-bold outline-none"
                                                    autoFocus
                                                />
                                                <span className="text-xs text-muted-foreground">min</span>
                                                <button onClick={handleSavePomoDuration} className="p-1 hover:bg-secondary rounded">
                                                    <Check className="w-4 h-4 text-green-500" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditingPomo(true)}
                                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <span className="font-medium">{pomodoroDuration} min</span>
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Pomodoro Break Skip */}
                                {timerType === 'pomodoro' && mode === 'break' && (
                                    <div>
                                        <button
                                            onClick={() => skipBreak()}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Skip Break
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4">
                                {status === 'running' ? (
                                    <button
                                        onClick={pause}
                                        className={cn(
                                            "rounded-full flex items-center justify-center transition-colors shadow-md",
                                            pipWindow ? "h-12 w-12" : "h-16 w-16",
                                            mode === 'focus'
                                                ? "bg-focus/20 text-focus hover:bg-focus/30 shadow-focus/25"
                                                : "bg-break/20 text-break hover:bg-break/30 shadow-break/25"
                                        )}
                                    >
                                        <Pause className={cn("fill-current", pipWindow ? "w-6 h-6" : "w-8 h-8")} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={start}
                                        className={cn(
                                            "rounded-full flex items-center justify-center transition-colors shadow-md",
                                            pipWindow ? "h-12 w-12" : "h-16 w-16",
                                            mode === 'focus'
                                                ? "bg-focus/20 text-focus hover:bg-focus/30 shadow-focus/25"
                                                : "bg-break/20 text-break hover:bg-break/30 shadow-break/25"
                                        )}
                                    >
                                        <Play className={cn("fill-current ml-1", pipWindow ? "w-6 h-6" : "w-8 h-8")} />
                                    </button>
                                )}

                                {(status !== 'idle' || accumulatedTime > 0) && (
                                    <button
                                        onClick={async () => {
                                            await stop();

                                            if (timerType === 'flowmodoro' && mode === 'focus') {
                                                // Manual stop in Flowmodoro Focus -> Switch to Break
                                                setMode('break');
                                            } else {
                                                // Reset display logic (standard behavior)
                                                if (timerType === 'flowmodoro') {
                                                    setDisplayTime(mode === 'focus' ? 0 : earnedBreakTime);
                                                } else {
                                                    setDisplayTime(mode === 'focus' ? pomodoroDuration * 60 : (pomodoroDuration * 60) / flowmodoroRatio);
                                                }
                                            }
                                        }}
                                        className={cn(
                                            "rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors shadow-md",
                                            pipWindow ? "h-12 w-12" : "h-16 w-16"
                                        )}
                                    >
                                        <Square className={cn("fill-current", pipWindow ? "w-4 h-4" : "w-6 h-6")} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );

                    if (pipWindow) {
                        return createPortal(content, pipWindow.document.body);
                    }

                    return content;
                })()}
            </div>
        </div >
    );
}
