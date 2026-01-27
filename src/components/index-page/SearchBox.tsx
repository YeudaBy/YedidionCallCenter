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

    return  <Flex className={"gap-2"}>
        <Tremor.TextInput
            color={"amber"}
            className={"w-full"}
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
        }}/>
    </Flex>
}
