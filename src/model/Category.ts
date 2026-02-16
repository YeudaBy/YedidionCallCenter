import {Allow, Entity, Fields, Relations} from "remult";
import {NanoIdField} from "@/utils/types";
import {District} from "@/model/District";
import * as RemixIcon from "@remixicon/react"
import {ProcedureCategory} from "@/model/ProcedureCategory";
import {UserRole} from "@/model/User";

const CATEGORY_ID_LENGTH = 7;


@Entity<Category>("category", {
    allowApiCrud: UserRole.SuperAdmin,
    allowApiRead: Allow.authenticated
})
export class Category {
    @NanoIdField(CATEGORY_ID_LENGTH)
    id!: string;

    @Fields.string()
    title!: string;

    @Fields.object({
        defaultValue: () => [District.General],
    })
    allowedDistricts: District[] = [District.General];

    @Fields.boolean({
        defaultValue: () => true,
    })
    active: boolean = true;

    @Fields.number({
            defaultValue: () => 0,
    })
    importance: number = 0;

    @Fields.string({
        validate: remixIconValidator,
    })
    icon?: string = undefined;

    @Fields.createdAt()
    createdAt!: Date;

    // Relationships

    /**
     * Make a recursive relationship to parent category, allowing for subcategories.
     * This is a self-referencing relationship, where a category can have a parent category.
     * The parent category is optional, allowing for top-level categories that do not have a parent.
     * The relationship is defined as a one-to-many relationship, where one parent category can have many subcategories.
     */
    @Relations.toOne(() => Category, {
        defaultIncluded: true,
        field: "parentCategoryId",
    })
    parentCategory?: Category;

    @Fields.string()
    parentCategoryId?: string;

    /**
     * Relation to subcategories, allowing for easy access to all subcategories of a category.
     * This is a one-to-many relationship, where one parent category can have many subcategories.
     */
    @Relations.toMany(() => Category, "parentCategoryId")
    subCategories?: Category[];

    /**
     * Relation to procedures, allowing for easy access to all procedures that belong to a category.
     * This is a one-to-many relationship, where one category can have many procedures.
     */
    @Relations.toMany(() => ProcedureCategory, "categoryId")
    procedures?: ProcedureCategory[];

}

function remixIconValidator(value: Category) {
    if (!value.icon) return true
    console.log({value})
    return (Object.keys(RemixIcon).includes(value.icon))
}
