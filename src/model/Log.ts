import {Entity, Fields, IdEntity} from "remult";

export enum LogType {
    Created = "נוצר",
    Updated = "עודכן",
    Deleted = "נמחק",
    Other = "אחר"
}

@Entity("log", {
    allowApiCrud: () => {
        return true
    }
})
export class Log extends IdEntity {
    @Fields.createdAt()
    createdAt!: Date;

    @Fields.string()
    byUserId!: string;

    @Fields.string()
    procedureId!: string;

    @Fields.string()
    log!: string;

    @Fields.enum(() => LogType)
    type: LogType = LogType.Other;
}
