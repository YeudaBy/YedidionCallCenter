import {Entity, Field, Fields, IdEntity, Relations, remult} from "remult";
import {District} from "./District";
import {LogAction} from "@/model/LogAction";

const logActionRepo = remult.repo(LogAction);

@Entity("procedure", {
    allowApiCrud: () => {
        return true
    },
    // saving: async (self: Procedure, e) => {
    //     if (e.isNew) {
    //         await logActionRepo.insert({
    //             by: remult.user?.name || "--",
    //             change: `נוצר נוהל חדש: ${self.title}`,
    //             procedure: self
    //         })
    //     } else {
    //         // get changes
    //         const old = await remult.repo(Procedure).findId(self.id);
    //         if (!old) {
    //             throw new Error("Procedure not found");
    //         }
    //         const changes = [];
    //         if (old.title !== self.title) {
    //             changes.push(`שם: ${old.title} -> ${self.title}`);
    //         }
    //         if (old.procedure !== self.procedure) {
    //             changes.push(`תוכן: ${old.procedure} -> ${self.procedure}`);
    //         }
    //         if (old.active !== self.active) {
    //             changes.push(`פעיל: ${old.active} -> ${self.active}`);
    //         }
    //         if (old.type !== self.type) {
    //             changes.push(`סוג: ${old.type} -> ${self.type}`);
    //         }
    //         if (old.districts.join(",") !== self.districts.join(",")) {
    //             changes.push(`מחוזות: ${old.districts.join(",")} -> ${self.districts.join(",")}`);
    //         }
    //         if (old.keywords.join(",") !== self.keywords.join(",")) {
    //             changes.push(`מילות מפתח: ${old.keywords.join(",")} -> ${self.keywords.join(",")}`);
    //         }
    //         if (old.images.join(",") !== self.images.join(",")) {
    //             changes.push(`תמונות: ${old.images.join(",")} -> ${self.images.join(",")}`);
    //         }
    //         if (changes.length > 0) {
    //             await logActionRepo.insert({
    //                 by: remult.user?.name || "--",
    //                 change: `עדכון נוהל: ${self.title} - ${changes.join(", ")}`,
    //                 procedure: self
    //             })
    //         }
    //     }
    // },
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

    @Relations.toMany(() => LogAction)
    logActions?: LogAction[];
}

export enum ProcedureType {
    Guideline = "הנחיה",
    Procedure = "נוהל",
}
