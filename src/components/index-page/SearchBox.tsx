import {Flex, Icon} from "@tremor/react";
import * as Tremor from "@tremor/react";
import {SearchIcon} from "@heroicons/react/solid";
import {RiCloseLine} from "@remixicon/react";
import {useRouter} from "next/router";

export function SearchBox({
    query, setQuery, setResults
                          }: {
    query: string | undefined,
    setQuery: (q: string | undefined) => void,
    setResults: (r: any[] | undefined) => void,
}) {
    const router = useRouter()

    return  <Flex className={"gap-2 px-1 py-0.5 grow border-2 rounded-xl shadow focus-within:ring-2"}>
        <Tremor.TextInput
            color={"amber"}
            className={"grow border-0 ring-0 focus:ring-0 focus:border-0"}
            autoFocus
            placeholder={"חיפוש..."}
            value={query}
            onChange={e => {
                setQuery(e.target.value)
            }}
            onValueChange={v => {
                if (!v) {
                    setResults(undefined)
                    router.push('/')
                } else {
                    router.push(`/?q=${v}`)
                }
            }}
            icon={SearchIcon}
        />
        <Icon icon={RiCloseLine} variant={"light"} onClick={() => {
            router.push('/').then(() => setQuery(undefined))
        }} className={"cursor-pointer"}/>
    </Flex>
}
