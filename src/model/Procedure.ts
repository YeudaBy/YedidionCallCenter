import {Entity, Field, Fields, IdEntity, remult} from "remult";
import {District} from "./District";
import {UserRole} from "./User";

@Entity("procedure", {
    // allowApiRead: UserRole.Dispatcher,
    // allowApiInsert: [UserRole.SuperAdmin, UserRole.Admin],
    // allowApiUpdate: [UserRole.SuperAdmin, UserRole.Admin],
    // allowApiDelete: UserRole.Admin,
    allowApiCrud: true,
    allowApiRead: true,
    saving: async (self: Procedure) => {
        self.owner = `${remult.user?.name} - ${remult.user?.name}`
    },
})
export class Procedure extends IdEntity {
    @Fields.string()
    title!: string;

    @Fields.string()
    description!: string;

    @Fields.string()
    procedure!: string;

    // @Fields.number({
    //     allowApiUpdate: true,
    // })
    // views: number = 1;

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

    // @BackendMethod({allowed: true})
    // static async increaseViews(id: string) {
    //     let procedure = await remult.repo(Procedure).findId(id);
    //     procedure.views++;
    //     await procedure.save();
    // }
}

export enum ProcedureType {
    Guideline = "הנחיה",
    Procedure = "נוהל",
}
