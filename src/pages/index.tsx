import {useEffect, useState} from "react";
import {remult} from "remult";
import {Procedure} from "@/model/Procedure";
import {ProcedurePreview} from "@/components/ProcedurePreview";
import {Flex, Grid, TextInput} from "@tremor/react";
import {useRouter} from "next/router";

const procedureRepo = remult.repo(Procedure);


export default function Home() {
    const [recent, setRecent] = useState<Procedure[]>()
    const [results, setResults] = useState<Procedure[]>()
    const [query, setQuery] = useState<string>()
    const router = useRouter()

    useEffect(() => {
        const q = router.query.q
        if (q) {
            setQuery(q.toString())
        }
    }, [router.query.q]);

    useEffect(() => {
        procedureRepo.find({
            orderBy: {
                createdAt: 'asc'
            },
            limit: 5,
        }).then(procedures => {
            setRecent(procedures)
        })
    }, []);

    useEffect(() => {
        if (!query) return
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
        })
    }, [query]);

    return (
        <Flex flexDirection={"col"} className={"p-4"}>
            <TextInput
                className={"w-full"}
                placeholder={"חיפוש..."}
                value={query}
                onChange={e => {
                    setQuery(e.target.value)
                }}
            />


            <Grid className={"gap-2 p-2"} numItems={1} numItemsSm={2} numItemsLg={3}>
                {!query ? recent?.map(procedure => {
                    return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                }) : results?.map(procedure => {
                    return <ProcedurePreview procedure={procedure} key={procedure.id}/>
                })}
            </Grid>
        </Flex>
    )
}
