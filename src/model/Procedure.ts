import {Entity, Field, Fields, IdEntity} from "remult";

@Entity("procedure", {
    allowApiCrud: true,
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
}
