import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import {
    startOfDay, subDays, format, isSameDay,
    eachDayOfInterval, subMonths, startOfWeek
} from "date-fns";
import { cn } from "../lib/utils";
import { Calendar, Filter, Tag as TagIcon } from "lucide-react";

type DateRange = '7d' | '30d' | '60d' | 'custom';

export default function StatsPage() {
    const [range, setRange] = useState<DateRange>('7d');
    const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    const sessions = useLiveQuery(() => db.sessions.toArray());
    const tags = useLiveQuery(() => db.tags.toArray());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [sessions]);

    // Better to use empty dependency for "default" scroll.
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, []);

    // --- Filtering Logic ---
    const getFilterDate = () => {
        const today = startOfDay(new Date());
        switch (range) {
            case '30d': return subDays(today, 29);
            case '60d': return subDays(today, 59);
            case 'custom': return startOfDay(new Date(customStart));
            default: return subDays(today, 6); // 7 days inclusive
        }
    };

    const getEndDate = () => {
        if (range === 'custom') return startOfDay(new Date(customEnd));
        return startOfDay(new Date());
    };

    const startDate = getFilterDate();
    const endDate = getEndDate();

    // --- Data Processing for Stacked Bar Chart ---
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    const barData = dateInterval.map(date => {
        const daySessions = sessions?.filter(s =>
            s.type === 'work' && isSameDay(new Date(s.startTime), date)
        ) || [];

        // Distribute minutes by tag for this day
        const dayStats: { [key: string]: any } = {
            date: format(date, range === '7d' ? 'EEE' : 'MMM d'),
            fullDate: format(date, 'MMM d, yyyy'),
            totalMinutes: 0
        };

        daySessions.forEach(session => {
            const minutes = session.duration / 60;
            const tagKey = session.tagId ? `tag_${session.tagId}` : 'untagged';

            dayStats[tagKey] = (dayStats[tagKey] || 0) + minutes;
            dayStats.totalMinutes += minutes;
        });

        // Round all values
        Object.keys(dayStats).forEach(key => {
            if (typeof dayStats[key] === 'number') {
                dayStats[key] = Math.round(dayStats[key]);
            }
        });

        return dayStats;
    });

    // Helper to get tag color (shared between charts)
    const getTagColor = (tagId?: number) => {
        if (!tagId) return '#94a3b8'; // slate-400 for untagged
        return tags?.find(t => t.id === tagId)?.color || '#94a3b8';
    }

    const getTagName = (tagId?: number) => {
        if (!tagId) return 'Untagged';
        return tags?.find(t => t.id === tagId)?.name || 'Unknown';
    }


    // --- Tag Stats for Pie Chart (Based on Filtered Range) ---
    const filteredSessions = sessions?.filter(s =>
        s.type === 'work' &&
        new Date(s.startTime) >= startDate &&
        new Date(s.startTime) <= new Date(endDate.getTime() + 86400000)
    ) || [];

    const tagStats = tags?.map(tag => {
        const duration = filteredSessions
            .filter(s => s.tagId === tag.id)
            .reduce((acc, s) => acc + s.duration, 0);
        return {
            name: tag.name,
            color: tag.color,
            minutes: Math.round(duration / 60)
        };
    }).filter(t => t.minutes > 0).sort((a, b) => b.minutes - a.minutes) || [];

    const untaggedDuration = filteredSessions
        .filter(s => !s.tagId)
        .reduce((acc, s) => acc + s.duration, 0);

    if (untaggedDuration > 0) {
        tagStats.push({
            name: 'Untagged',
            color: '#94a3b8',
            minutes: Math.round(untaggedDuration / 60)
        });
    }

    // Gantt Chart Data (Last 7 Days Fixed)
    const ganttDays = eachDayOfInterval({
        start: subDays(startOfDay(new Date()), 6),
        end: startOfDay(new Date())
    });

    // Heatmap Data (Last 12 Months)
    const heatmapStartDate = startOfWeek(subMonths(startOfDay(new Date()), 12), { weekStartsOn: 1 });
    const heatmapData = eachDayOfInterval({ start: heatmapStartDate, end: new Date() });

    const getIntensity = (minutes: number) => {
        if (minutes === 0) return 'bg-secondary/30';
        if (minutes < 30) return 'bg-green-200';
        if (minutes < 60) return 'bg-green-400';
        if (minutes < 120) return 'bg-green-600';
        if (minutes < 240) return 'bg-green-700';
        return 'bg-green-900';
    };

    // Stats Totals
    const totalFocusMinutes = sessions
        ?.filter(s => s.type === 'work')
        .reduce((acc, s) => acc + s.duration, 0) || 0;
    const totalMinutes = Math.round(totalFocusMinutes / 60);

    return (
        <div className="max-w-screen-lg mx-auto space-y-12 pb-12">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
                <p className="text-muted-foreground">Track your productivity over time.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="text-sm font-medium text-muted-foreground">Lifetime Focus Time</div>
                    <div className="text-3xl font-bold mt-2">{totalMinutes} <span className="text-sm font-normal text-muted-foreground">mins</span></div>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="text-sm font-medium text-muted-foreground">Total Sessions</div>
                    <div className="text-3xl font-bold mt-2">{sessions?.filter(s => s.type === 'work').length || 0}</div>
                </div>
                {/* Focus by Tag (Top Tag) */}
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="text-sm font-medium text-muted-foreground">Top Tag (Selected Range)</div>
                    <div className="text-3xl font-bold mt-2">
                        {tagStats.length > 0 ? tagStats[0].name : '-'}
                    </div>
                </div>
            </div>

            {/* 1. Stacked Bar Chart with Date Filters */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Activity Overview
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center bg-secondary/30 rounded-lg p-1">
                            {(['7d', '30d', '60d'] as const).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                        range === r ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Last {r.replace('d', '')} days
                                </button>
                            ))}
                            <button
                                onClick={() => setRange('custom')}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                    range === 'custom' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Custom
                            </button>
                        </div>
                        {range === 'custom' && (
                            <div className="flex items-center gap-2 text-sm bg-secondary/30 p-1 rounded-lg">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 px-2 py-0.5 text-xs"
                                />
                                <span className="text-muted-foreground">-</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 px-2 py-0.5 text-xs"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-xl bg-card border border-border h-[400px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} stackOffset="sign">
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="var(--muted-foreground)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}m`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--secondary)', opacity: 0.5 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const total = payload.reduce((acc, p) => acc + (p.value as number), 0);
                                            return (
                                                <div className="bg-popover border border-border p-2 rounded shadow-sm text-sm">
                                                    <p className="font-medium text-foreground mb-1">{payload[0].payload.fullDate}</p>
                                                    {payload.map((entry, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-muted-foreground">{entry.name}:</span>
                                                            <span className="font-medium">{entry.value}m</span>
                                                        </div>
                                                    ))}
                                                    <div className="mt-1 pt-1 border-t border-border flex justify-between font-medium">
                                                        <span>Total:</span>
                                                        <span>{total}m</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {/* Render a Bar for each tag present in the system, plus untagged */}
                                {tags?.map(tag => (
                                    <Bar
                                        key={tag.id}
                                        dataKey={`tag_${tag.id}`}
                                        name={tag.name}
                                        stackId="a"
                                        fill={tag.color}
                                        radius={[0, 0, 0, 0]}
                                    />
                                ))}
                                <Bar
                                    dataKey="untagged"
                                    name="Untagged"
                                    stackId="a"
                                    fill="#94a3b8"
                                    radius={[4, 4, 0, 0]} // Top radius only on the last one? Recharts handles this awkwardly with dynamic content.
                                // Actually, radius on stacked bars usually applies to the *last* non-zero segment. 
                                // Recharts doesn't auto-handle mixed stacks perfectly for radius. 
                                // Let's just remove radius for stacked segments to look clean, or use a small one for all if allowed.
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-xl bg-card border border-border h-[400px] flex flex-col">
                        <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                            <TagIcon className="w-4 h-4" /> Distribution (mins)
                        </h4>
                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            {tagStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={tagStats}
                                            dataKey="minutes"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                        >
                                            {tagStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-popover border border-border p-2 rounded shadow-sm text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                                                                <span className="font-medium">{data.name}</span>
                                                            </div>
                                                            <div className="text-muted-foreground ml-4">{data.minutes} mins</div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-muted-foreground text-sm">No data</div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {tagStats.map(tag => (
                                <div key={tag.name} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded-full">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                    <span>{tag.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Gantt Chart (Last 7 Days) */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Daily Timeline (Last 7 Days)
                </h3>
                <div className="p-6 rounded-xl bg-card border border-border space-y-4 overflow-x-auto">
                    {ganttDays.reverse().map((day) => {
                        const daySessions = sessions?.filter(s =>
                            isSameDay(new Date(s.startTime), day)
                        ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime()) || [];

                        return (
                            <div key={day.toISOString()} className="flex items-center gap-4">
                                <div className="w-24 flex-shrink-0 text-sm text-muted-foreground font-medium">
                                    {format(day, 'MMM d, EEE')}
                                </div>
                                <div className="flex-1 h-8 bg-secondary/30 rounded-md relative overflow-hidden">
                                    {/* Hour markers simplified */}
                                    {[0, 6, 12, 18].map(h => (
                                        <div key={h} className="absolute top-0 bottom-0 border-l border-border/50 text-[10px] text-muted-foreground pl-1" style={{ left: `${(h / 24) * 100}%` }}>
                                            {h}h
                                        </div>
                                    ))}

                                    {daySessions.map(session => {
                                        const startMins = session.startTime.getHours() * 60 + session.startTime.getMinutes();
                                        const durationMins = Math.round(session.duration / 60);
                                        const startPercent = (startMins / 1440) * 100;
                                        const widthPercent = Math.max((durationMins / 1440) * 100, 0.5); // min width for visibility

                                        let sessionColor = getTagColor(session.tagId);
                                        let sessionLabel = getTagName(session.tagId);

                                        if (session.type === 'break') {
                                            sessionColor = 'var(--muted)'; // Use a muted color for breaks
                                            sessionLabel = 'Break';
                                        }

                                        return (
                                            <div
                                                key={session.id}
                                                className={cn(
                                                    "absolute top-1 bottom-1 rounded-sm opacity-90 hover:opacity-100 transition-opacity cursor-help group",
                                                    session.type === 'break' && "border border-border/50" // Optional border for breaks
                                                )}
                                                style={{
                                                    left: `${startPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    backgroundColor: session.type === 'break' ? 'var(--secondary)' : sessionColor
                                                }}
                                            >
                                                {/* Tooltip on hover */}
                                                <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border border-border whitespace-nowrap z-50 shadow-sm flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: session.type === 'break' ? 'var(--secondary)' : sessionColor }} />
                                                    <span>{sessionLabel}</span>
                                                    <span className="opacity-50">|</span>
                                                    <span>{format(session.startTime, 'HH:mm')} - {Math.round(session.duration / 60)}m</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Heat Map (Last 12 Months) */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Consistency (Last 12 Months)</h3>
                <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="flex gap-2">
                        {/* Weekday Labels */}
                        <div className="grid grid-rows-7 gap-1 text-xs text-muted-foreground pt-6 h-full font-medium">
                            <div>Mon</div>
                            <div>Tue</div>
                            <div>Wed</div>
                            <div>Thu</div>
                            <div>Fri</div>
                            <div>Sat</div>
                            <div>Sun</div>
                        </div>

                        {/* Chart Area */}
                        <div ref={scrollContainerRef} className="overflow-x-auto pb-2 flex-1">
                            <div className="min-w-max">
                                {/* Month Labels */}
                                <div className="flex text-xs text-muted-foreground mb-2 px-1">
                                    {heatmapData.map((day, index) => {
                                        // Show month label roughly at the start of each month (only for the first week of the month)
                                        if (index % 7 === 0 && day.getDate() <= 7) {
                                            return (
                                                <div key={index} className="flex-1 text-left" style={{ width: 'calc(12px * 4 + 4px * 4)' }}>
                                                    {format(day, 'MMM')}
                                                </div>
                                            )
                                        }
                                        return null;
                                    })}
                                </div>

                                {/* The Grid */}
                                <div className="inline-grid grid-rows-7 grid-flow-col gap-1">
                                    {heatmapData.map(day => {
                                        const dayMinutes = sessions?.filter(s =>
                                            s.type === 'work' && isSameDay(new Date(s.startTime), day)
                                        ).reduce((acc, s) => acc + (s.duration / 60), 0) || 0;

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={cn(
                                                    "w-3 h-3 rounded-[2px] transition-colors relative group",
                                                    getIntensity(Math.round(dayMinutes))
                                                )}
                                            >
                                                <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border border-border whitespace-nowrap z-10 pointer-events-none">
                                                    {format(day, 'MMM d, yyyy')}: {Math.round(dayMinutes)}m
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-[2px] bg-secondary/30" />
                            <div className="w-3 h-3 rounded-[2px] bg-green-200" />
                            <div className="w-3 h-3 rounded-[2px] bg-green-400" />
                            <div className="w-3 h-3 rounded-[2px] bg-green-600" />
                            <div className="w-3 h-3 rounded-[2px] bg-green-900" />
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
