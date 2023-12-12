import {Allow, Entity, Field, Fields, IdEntity, remult} from "remult";

@Entity("procedure", {
    allowApiCrud: Allow.authenticated,
    allowApiRead: true,
    saving: async (self: Procedure) => {
        self.owner = `${remult.user?.name} - ${remult.user?.phone}`
    },
})
export class Procedure extends IdEntity {
    @Fields.string()
    title!: string;

    @Fields.string()
    description!: string;

    @Fields.string()
    procedure!: string;

    @Fields.number()
    views: number = 0;

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
}
