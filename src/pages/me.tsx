import {useEffect, useState} from "react";
import {User, UserRole} from "@/model/User";
import {remult} from "remult";
import * as Tremor from "@tremor/react";
import {Button, Card, Flex, Icon, Text, TextInput} from "@tremor/react";
import {signOut} from "next-auth/react";
import {ConfirmDeleteUserDialog} from "@/components/dialogs/ConfirmDeleteUserDialog";
import {RiCheckLine} from "@remixicon/react";
import {LoadingSpinner} from "@/components/Spinner";
import {Header, Headers} from "@/components/Header";

const userRepo = remult.repo(User);

export default function MePage() {
    const [me, setMe] = useState<User>()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [phone, setPhone] = useState<string>()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true)
        if (!remult.user) return
        return userRepo.liveQuery({where: {id: remult.user.id}})
            .subscribe(user => {
                setMe(user.items[0])
                setLoading(false)
            })
    }, []);

    return <Tremor.Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
        <Header headerText={Headers.ME} buttons={[]} />
        <Card className={""}>
            <Tremor.List className={""}>
                <Tremor.ListItem>
                    <Tremor.Text>
                        {me?.name}
                    </Tremor.Text>
                    <Tremor.Badge>
                        {me?.roles.includes(UserRole.Dispatcher) ? me?.district || "--" : "מנהל"}
                    </Tremor.Badge>
                </Tremor.ListItem>
                <Tremor.ListItem>
                    {
                        !!me?.phoneFormatted ?
                            <Text>{me.phoneFormatted}</Text>
                            : <form className={"w-full"}>
                                <Flex className={""}>
                                    <TextInput
                                        pattern={"^[5-9]\\d{8}$"}
                                        inputMode={"tel"}
                                        enterKeyHint={"enter"}
                                        value={phone}
                                        onValueChange={setPhone}
                                        placeholder={"הזינו את מספר הטלפון שלכם"}
                                        className={"grow"}
                                    />
                                    <Button variant={"light"}>
                                        {
                                            loading ? <LoadingSpinner className={""}/> :
                                                <Icon icon={RiCheckLine}/>
                                        }
                                    </Button>
                                </Flex>
                                <Text className={"text-right text-xs"}> ללא 0 בהתחלה (לדוגמה 531234567)</Text>
                            </form>
                    }
                </Tremor.ListItem>
            </Tremor.List>

            <Flex className={"gap-2 mt-10"}>
                <Tremor.Button className={"grow"}
                               onClick={() => void signOut()}>
                    התנתק
                </Tremor.Button>

                <Tremor.Button onClick={() => setDeleteDialogOpen(true)}
                               className={"grow"} color={"red"} variant={"secondary"}>
                    מחיקת חשבון
                </Tremor.Button>
            </Flex>

            {deleteDialogOpen && !!me &&
                <ConfirmDeleteUserDialog
                    onClose={() => setDeleteDialogOpen(false)}
                    user={me}/>}
        </Card>
    </Tremor.Flex>

}
