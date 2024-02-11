import React, {useEffect} from "react";

export function Backdrop({children, open}: {
    open: boolean;
    children: React.ReactNode,
    close: () => void
}) {

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
    }, [open])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                close()
            }
        }
        if (open) {
            window.addEventListener("keydown", handleKey)
        } else {
            window.removeEventListener("keydown", handleKey)
        }
        return () => {
            window.removeEventListener("keydown", handleKey)
        }
    }, [open]);

    return (
        <div
            onBlur={close}
            className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${open ? "" : "hidden"}`}
        >
            {children}
        </div>
    )
}
