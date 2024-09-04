import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, diff_match_patch} from 'diff-match-patch';

const CONTEXT_LENGTH = 8; // Number of characters to show before and after the change

export function diff(old: string, newTxt: string): string | undefined {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(old, newTxt);
    dmp.diff_cleanupSemantic(diffs);

    // Helper function to get a snippet around the change
    const getSnippet = (text: string, start: number, end: number): string => {
        const startContext = Math.max(0, start - CONTEXT_LENGTH);
        const endContext = Math.min(text.length, end + CONTEXT_LENGTH);
        return `${text.substring(startContext, start)}<mark>${text.substring(start, end)}</mark>${text.substring(end, endContext)}`;
    };

    let changeDescription = "";
    let lastIndex = 0;

    diffs.forEach(([type, text], index) => {
        const start = lastIndex;
        const end = lastIndex + text.length;
        lastIndex = end;

        if (type === DIFF_INSERT) {
            changeDescription += `<b>${getSnippet(newTxt, start, end)}</b>`;
        } else if (type === DIFF_DELETE) {
            changeDescription += `<del>${getSnippet(old, start, end)}</del>`;
        } else if (type === DIFF_EQUAL) {
            changeDescription += text;
        }
    });

    // If there are no changes, return undefined
    if (changeDescription.trim() === old.trim() || changeDescription.trim() === newTxt.trim()) {
        return undefined;
    }

    // Adding ellipses if there are significant differences
    if (changeDescription.length > 200) { // Example threshold
        changeDescription = `...${changeDescription.substring(0, 100)}...${changeDescription.substring(changeDescription.length - 100)}...`;
    }

    return changeDescription;
}
