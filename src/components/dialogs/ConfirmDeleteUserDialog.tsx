import {User} from "@/model/User";
import {signOut} from "next-auth/react";
import * as Tremor from "@tremor/react";
import {Flex, Text} from "@tremor/react";
import {CloseDialogButton} from "@/components/CloseDialogButton";
import {remult} from "remult";
import {toast} from "sonner";

export function ConfirmDeleteUserDialog({onClose, user}: { onClose: () => void, user: User }) {

    const deleteAccount = async () => {
        if (!user) return
        console.log(`User ${user.name} has deleted by ${remult.user?.name}`)
        await remult.repo(User).delete(user?.id)
        await signOut()
        toast.success("החשבון נמחק בהצלחה")
    }

    return <Tremor.Dialog open={true} onClose={onClose}>
        <Tremor.DialogPanel className={"gap-1.5 flex items-center flex-col"}>
            <CloseDialogButton close={onClose}/>
            <Tremor.Title>
                האם אתה משוכנע שאתה רוצה למחוק את החשבון?
            </Tremor.Title>
            <Text className={"text-right"}>
                שים לב שפעולה זו אינה ניתנת לשחזור, במידה והחשבון ימחק תצטרך ליצור אותו מחדש על כל המשתמע.
            </Text>
            <Flex alignItems={"center"} className={"gap-2"}>
                <Tremor.Button color={"red"} onClick={deleteAccount} className={"grow"}>
                    מחק חשבון
                </Tremor.Button>
                <Tremor.Button className={"grow"}
                               onClick={onClose}>
                    התחרטתי
                </Tremor.Button>
            </Flex>

        </Tremor.DialogPanel>
    </Tremor.Dialog>
}
