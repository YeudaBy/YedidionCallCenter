import {BackendMethod, remult} from "remult";
import {Procedure} from "@/model/Procedure";

export class ApiController {
    @BackendMethod({allowed: true})
    static async addNew(
        content: string,
        title: string,
        tags: string[],
    ) {
        const repo = remult.repo(Procedure)

        await repo.insert({
            title,
            procedure: content,
            keywords: tags,
        })

        return true
    }
}
