"use client";

import React, {ElementType, useEffect, useMemo, useState} from "react";
import {Card, Icon, Metric, Text, TextInput, Title} from "@tremor/react";
import {FixedSizeGrid as Grid} from "react-window";
import {toast} from "sonner";

// Note: comments are in English to match the user's preference for code comments.

type IconEntry = { name: string; Component: ElementType };

const REMIXICON_URL = "https://remixicon.com/"

export default function RemixIconsPage() {
    const [icons, setIcons] = useState<IconEntry[] | null>(null);
    const [query, setQuery] = useState("");
    const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1200);

    // Load remixicon-react dynamically on the client to avoid huge SSR bundle.
    useEffect(() => {
        let mounted = true;
        import("@remixicon/react").then((mod) => {
            if (!mod || typeof mod !== "object") return;
            if (!mounted) return;
            // Get all exported icon components
            const entries: IconEntry[] = Object.entries(mod)
                .filter(([, v]) => typeof v === "function")
                .map(([k, v]) => ({name: k, Component: v}));

            // Sort alphabetically for predictable order
            entries.sort((a, b) => a.name.localeCompare(b.name));
            setIcons(entries);
        });

        return () => {
            mounted = false;
        };
    }, []);

    // Watch window resize so the grid can recalculate columns
    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Filter icons by name (case-insensitive)
    const filtered = useMemo(() => {
        if (!icons) return [];
        const q = query.trim().toLowerCase();
        if (!q) return icons;
        return icons.filter((i) => i.name.toLowerCase().includes(q));
    }, [icons, query]);

    // Copy to clipboard and show small feedback
    const copyName = async (name: string) => {
        try {
            await navigator.clipboard.writeText(name);
            toast.success(`Copied "${name}" to clipboard!`);
        } finally { /* empty */
        }
    };

    // Grid layout config
    const columnWidth = 160; // px per column
    const rowHeight = 104; // px per row
    const containerPadding = 8 * 2; // left + right padding
    const columns = Math.max(1, Math.floor((width - containerPadding) / columnWidth));
    const rows = Math.ceil(filtered.length / columns || 1);


    return (
        <main className="p-3 text-left">
            <header className="mb-4">
                <Title>RemixIcons browser</Title>
                <p className="text-sm text-slate-500">Click an icon name to copy the component name to clipboard.</p>
                <a href={REMIXICON_URL} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-blue-500 hover:underline">
                    View on RemixIcon.com
                </a>
            </header>

            <section className="mb-4 max-w-2xl">
                <Card>
                    <div className="flex gap-3 items-center">
                        <TextInput
                            value={query}
                            onValueChange={setQuery}
                            placeholder="חפש אייקון לפי שם (אנגלית)..."
                            className="flex-1"
                        />
                        <div className="min-w-[120px] text-right">
                            <Metric>{icons ? `${filtered.length}/${icons.length}` : "..."}</Metric>
                        </div>
                    </div>
                </Card>
            </section>

            <section>
                {!icons ? (
                    <div className="flex items-center justify-center h-40">
                        <div>Loading icons...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center text-slate-500">No icons match your search.</div>
                ) : (
                    <div style={{width: "100%", height: `calc(100vh - 220px)`}}>
                        <Grid
                            columnCount={columns}
                            columnWidth={columnWidth}
                            height={Math.min(600, rows * rowHeight)}
                            rowCount={rows}
                            rowHeight={rowHeight}
                            width={Math.min(width - 48, columns * columnWidth)}
                            className={"gap-2"}
                        >
                            {/*  @ts-expect-error react-window types are weird */}
                            {({columnIndex, rowIndex, style}) => {
                                const index = rowIndex * columns + columnIndex;
                                if (index >= filtered.length) return null;
                                const entry = filtered[index];
                                const icon = entry.Component;

                                return (
                                    <Card
                                        style={{...style, padding: 8}}
                                        onClick={() => copyName(entry.name)}
                                        className="flex flex-col items-center justify-center border border-transparent hover:border-slate-200 rounded"
                                    >
                                        <div className="mb-2">
                                            <Icon icon={icon} size={"xl"}/>
                                        </div>
                                        <Text
                                            title="Copy component name"
                                            className="text-xs text-center break-words max-w-[140px]"
                                        >
                                            {entry.name}
                                        </Text>
                                    </Card>
                                );
                            }}
                        </Grid>
                    </div>
                )}
            </section>

            <footer className="mt-4 text-xs text-slate-500">
                <div>Notes:</div>
                <ul>
                    <li>- Icons are loaded client-side to keep initial SSR bundle small.</li>
                    <li>- Virtualized grid (react-window) keeps rendering fast even with thousands of icons.</li>
                    <li>- You can tweak columnWidth / rowHeight to fit your design.</li>
                </ul>
            </footer>
        </main>
    );
}
