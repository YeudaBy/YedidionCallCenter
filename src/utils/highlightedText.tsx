import {ReactNode} from "react";

export function highlightedText(text: string): ReactNode {
    // make text sorounding with * bold
    // replace \n with <br/>

    return text.split("\n").map((line, i) => {
        const bold = line.split("*").map((text, i) => {
            if (i % 2 === 0) {
                return text
            } else {
                return <span key={i} className={"font-bold"}>{text}</span>
            }
        })
        return <>{bold}<br/></>
    })
}

export function plainText(text: string): string {
    // remove * and \n
    return text.replace(/\*/g, "").replace(/\n/g, " ")
}
