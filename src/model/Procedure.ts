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

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            procedure: this.procedure,
            views: this.views,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            keywords: this.keywords,
        };
    }
}
