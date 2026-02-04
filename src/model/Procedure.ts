import {Entity, Field, Fields, IdEntity} from "remult";
import {District} from "./District";
import {NanoIdField} from "@/utils/types";


const PROCEDURE_ID_LENGTH = 7;


@Entity("procedure", {
    allowApiCrud: () => {
        return true
    }
})
export class Procedure {
    @NanoIdField(PROCEDURE_ID_LENGTH)
    id!: string;

    @Fields.string()
    title!: string;

    @Fields.string()
    procedure!: string;

    @Fields.createdAt()
    createdAt!: Date;

    @Fields.updatedAt()
    updatedAt!: Date;

    @Field(() => Array<string>)
    keywords: string[] = [];

    @Fields.string({
        includeInApi: false,
    })
    owner!: string;

    @Fields.object()
    districts: District[] = [District.General];

    @Fields.boolean()
    active: boolean = true;

    @Fields.object()
    type: ProcedureType = ProcedureType.Procedure;

    @Field(() => Array<string>)
    images: string[] = [];

    @Field(() => Array<string>)
    logs: string[] = [];

    parseToWaString() {
        return `${this.title}\n${this.procedure}`
    }
}

export enum ProcedureType {
    Guideline = "הנחיה",
    Procedure = "נוהל",
}
