import {Allow, Entity, Field, Fields, IdEntity} from "remult";
import {Procedure} from "@/model/Procedure";
import {User} from "@/model/User";

@Entity("event", {
    allowApiCrud: Allow.authenticated,
})
export class Event extends IdEntity {
    @Fields.createdAt()
    createdAt!: Date;

    @Field(() => Procedure)
    procedure!: Procedure;

    @Fields.string()
    event!: string;

    @Field(() => User)
    user!: User;
}
