import {Allow, Entity, Field, Fields, Relations} from "remult";
import {District} from "./District";
import {NanoIdField} from "@/utils/types";
import {ProcedureCategory} from "@/model/ProcedureCategory";

import {AdminRoles, UserRole} from "@/model/SuperAdmin";


const PROCEDURE_ID_LENGTH = 7;


@Entity("procedure", {
    allowApiRead: Allow.authenticated,
    allowApiDelete: UserRole.SuperAdmin,
    allowApiUpdate: AdminRoles,
    allowApiInsert: AdminRoles,
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

    @Fields.string({
        required: false
    })
    youtubeUrl?: string;

    @Relations.toMany(() => ProcedureCategory, "procedureId")
    categories?: ProcedureCategory[];
}

export enum ProcedureType {
    Guideline = "הנחיה",
    Procedure = "נוהל",
}
