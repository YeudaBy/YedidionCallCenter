import {Entity, Field, Fields, IdEntity, remult} from "remult";
import {District} from "./District";

@Entity("procedure", {
    allowApiCrud: () => {
        return true
    },
    saving: async (self: Procedure) => {
        self.owner = `${remult.user?.name} - ${remult.user?.name}`
    },
})
export class Procedure extends IdEntity {
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
}

export enum ProcedureType {
    Guideline = "הנחיה",
    Procedure = "נוהל",
}
