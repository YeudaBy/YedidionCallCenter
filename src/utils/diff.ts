import {DIFF_DELETE, DIFF_INSERT, diff_match_patch} from 'diff-match-patch';

const CONTEXT_LENGTH = 8; // Number of characters to show before and after the change

export function diff(old: string, newTxt: string): string | undefined {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(old, newTxt);
    dmp.diff_cleanupSemantic(diffs);

    let changeDescription = "";

    diffs.forEach(([type, text]) => {
        if (type === DIFF_INSERT) {
            changeDescription += `<b>${text}</b>`; // Add inserted text
        } else if (type === DIFF_DELETE) {
            changeDescription += `<del>${text}</del>`; // Add deleted text
        }
    });

    // If there are no changes, return undefined
    if (changeDescription.trim() === "") {
        return undefined;
    }

    return changeDescription;
}
