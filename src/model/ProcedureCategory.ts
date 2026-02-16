import {Allow, Entity, Fields, Relations} from "remult";
import {Procedure} from "@/model/Procedure";
import {Category} from "@/model/Category";

import {UserRole} from "@/model/SuperAdmin";

@Entity("procedureCategories", {
    allowApiRead: Allow.authenticated,
    allowApiCrud: UserRole.SuperAdmin,
    id: { procedureId: true, categoryId: true }
})
export class ProcedureCategory {
    @Fields.string()
    procedureId = "";

    @Fields.string()
    categoryId = "";

    @Relations.toOne(() => Procedure, { field: "procedureId" })
    procedure?: Procedure;

    @Relations.toOne(() => Category, {
        field: "categoryId",
        defaultIncluded: true
    })
    category?: Category;
}
