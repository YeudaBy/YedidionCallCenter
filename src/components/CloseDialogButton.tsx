import {RiCloseFill} from "@remixicon/react";
import {Icon} from "@tremor/react";

export function CloseDialogButton({close}: { close: () => void }) {
    return (
        <Icon
            variant={"light"}
            icon={RiCloseFill}
            onClick={() => close()}
            className={"-mt-4 rounded-full cursor-pointer ml-auto"}
        />
    )
}
