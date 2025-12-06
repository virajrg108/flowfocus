import { useEffect, useState } from "react";
import { useTimerStore } from "../store/useTimerStore";
import { Play, Pause, Square, Coffee, Brain, Pencil, Check } from "lucide-react";
import { cn } from "../lib/utils";

export default function TimerPage() {
    const {
        status, mode, startTime, accumulatedTime,
        timerType, pomodoroDuration, earnedBreakTime,
        start, pause, stop, setMode, setTimerType, setPomodoroDuration
    } = useTimerStore();

    const [displayTime, setDisplayTime] = useState(0);
    const [isEditingPomo, setIsEditingPomo] = useState(false);
    const [pomoInput, setPomoInput] = useState(pomodoroDuration.toString());

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
                        stop().then(() => setMode('focus'));
                    }
                }
            } else {
                // Pomodoro Logic
                let targetParams = pomodoroDuration * 60;
                if (mode === 'break') targetParams = (pomodoroDuration * 60) / 5;

                const remaining = Math.max(0, targetParams - totalElapsed);
                setDisplayTime(remaining);

                if (remaining === 0 && status === 'running') {
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
            <div className="w-full max-w-lg flex flex-col">
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
                        Flowmodoro
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
                <div className="flex flex-col items-center w-full bg-card border border-border rounded-b-2xl rounded-t-none p-8 shadow-2xl shadow-black/40 space-y-8">

                    {/* Mode Toggle (Focus/Break) */}
                    <div className="flex items-center gap-4 bg-secondary/50 p-2 rounded-full">
                        <button
                            onClick={() => setMode('focus')}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                                mode === 'focus' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Brain className="w-4 h-4" />
                            Focus
                        </button>
                        <button
                            onClick={() => setMode('break')}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                                mode === 'break' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Coffee className="w-4 h-4" />
                            Break
                        </button>
                    </div>

                    {/* Timer Display */}
                    <div className="relative group text-center py-8">
                        <div className="text-[120px] leading-none font-bold tabular-nums tracking-tighter text-foreground select-none">
                            {formatTime(displayTime)}
                        </div>

                        {/* Flowmodoro Info */}
                        {timerType === 'flowmodoro' && mode === 'focus' && status !== 'idle' && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
                                Break earned: {formatTime(Math.floor(displayTime / 5))}
                            </div>
                        )}
                        {timerType === 'flowmodoro' && mode === 'break' && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap">
                                Total Break: {formatTime(earnedBreakTime)}
                            </div>
                        )}

                        {/* Pomodoro Edit Controls */}
                        {timerType === 'pomodoro' && mode === 'focus' && status === 'idle' && (
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
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
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        {status === 'running' ? (
                            <button
                                onClick={pause}
                                className="h-16 w-16 rounded-full bg-secondary border border-primary/10 flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
                            >
                                <Pause className="w-8 h-8 fill-current" />
                            </button>
                        ) : (
                            <button
                                onClick={start}
                                className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                            >
                                <Play className="w-8 h-8 fill-current ml-1" />
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
                                            setDisplayTime(mode === 'focus' ? pomodoroDuration * 60 : (pomodoroDuration * 60) / 5);
                                        }
                                    }
                                }}
                                className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                            >
                                <Square className="w-6 h-6 fill-current" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
