import {useEffect, useState} from "react";
import {remult} from "remult";
import {Procedure} from "@/model/Procedure";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {Flex, Grid, TextInput} from "@tremor/react";
import {useRouter} from "next/router";
import {SearchIcon} from "@heroicons/react/solid";
import {Loading} from "@/components/Spinner";

const procedureRepo = remult.repo(Procedure);


export default function Home() {
    const [recent, setRecent] = useState<Procedure[]>()
    const [results, setResults] = useState<Procedure[]>()
    const [query, setQuery] = useState<string>()
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const q = router.query.q
        if (q) {
            setQuery(q.toString())
        }
    }, [router.query.q]);

    useEffect(() => {
        setLoading(true)
        procedureRepo.find({
            orderBy: {
                createdAt: 'asc'
            },
            limit: 5,
        }).then(procedures => {
            setRecent(procedures)
        }).finally(() => {
            setLoading(false)
        })
    }, []);

    useEffect(() => {
        if (!query) return
        setLoading(true)
        procedureRepo.find({
            where: {
                $or: [
                    {title: query},
                    {
                        keywords: {
                            $contains: query
                        }
                    }
                ]
            }
        }).then(procedures => {
            setResults(procedures)
        }).then(() => {
            setLoading(false)
        })
    }, [query]);

    return (
        <Flex flexDirection={"col"} className={"p-4 max-w-4xl m-auto"}>
            <TextInput
                color={"amber"}
                className={"w-full"}
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


            {loading ? <Loading/> :
                <Grid className={"gap-2 mt-3 w-full"} numItems={1} numItemsSm={2} numItemsLg={3}>
                    {!query ? recent?.map(procedure => {
                        return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                    }) : results?.map(procedure => {
                        return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                    })}
                </Grid>}
        </Flex>
    )
}
