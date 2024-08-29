import {ReactNode} from "react";
import Link from "next/link";
import {useRouter} from "next/router";

export function highlightedText(text: string): ReactNode {
    const router = useRouter();

    return text.split("\n").map((line, i) => {
        const processedLine = line.split(/(\*[^*]+\*)|(https?:\/\/[^\s]+)/g).map((part, i) => {
            if (!part) return null;

            if (part.startsWith("*") && part.endsWith("*")) {
                // Bold text
                return <span key={i} className="font-bold">{part.slice(1, -1)}</span>;
            } else if (part.startsWith("http://") || part.startsWith("https://")) {
                // Link
                if (part.startsWith(router.basePath)) {
                    return (
                        <Link key={i} href={part} className={"text-blue-600 underline"}>
                            {part}
                        </Link>
                    );
                } else {
                    return (
                        <a key={i} href={part} className={"text-blue-600 underline"}
                           target="_blank" rel="noopener noreferrer">
                            {part}
                        </a>
                    );
                }
            }
            return part;
        });

        return <span key={i}>{processedLine}<br/></span>;
    });
}

export function plainText(text: string): string {
    // Remove * and \n
    return text.replace(/\*/g, "").replace(/\n/g, " ");
}
