import {Category} from "@/model/Category";
import {Procedure} from "@/model/Procedure";
import {ProcedureCategory} from "@/model/ProcedureCategory";
import {BackendMethod, Controller, remult, repo} from "remult";
import {UserRole} from "@/model/SuperAdmin";

@Controller("knowledgeBase")
export class KnowledgeBaseController {

    @BackendMethod({allowed: true})
    static async getCategoryPath(categoryId: string): Promise<Category[]> {
        const categoryRepo = repo(Category);
        const path: Category[] = [];
        let currentId: string | undefined = categoryId;
        const visited = new Set<string>();

        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const cat = await categoryRepo.findFirst({id: currentId});

            if (!cat) break;

            path.unshift(cat);
            currentId = cat.parentCategoryId;
        }

        return path;
    }


    @BackendMethod({allowed: true})
    static async updateProcedureCategories(procedureId: string, categoryIds: string[]): Promise<void> {
        const pcRepo = repo(ProcedureCategory);

        const existingRelations = await pcRepo.find({where: {procedureId}});
        for (const rel of existingRelations) {
            await pcRepo.delete(rel);
        }

        const uniqueCategoryIds = [...new Set(categoryIds)];

        for (const catId of uniqueCategoryIds) {
            await pcRepo.insert({
                procedureId: procedureId,
                categoryId: catId
            });
        }
    }

    @BackendMethod({allowed: true})
    static async getProceduresInBranch(rootCategoryId: string): Promise<Procedure[]> {
        const catRepo = repo(Category);
        const pcRepo = repo(ProcedureCategory);

        async function getAllChildIds(id: string): Promise<string[]> {
            const children = await catRepo.find({where: {parentCategoryId: id}});
            let ids = [id];
            for (const child of children) {
                const childIds = await getAllChildIds(child.id);
                ids = [...ids, ...childIds];
            }
            return ids;
        }

        const branchCategoryIds = await getAllChildIds(rootCategoryId);

        const relations = await pcRepo.find({
            where: {categoryId: branchCategoryIds},
            include: {procedure: true}
        });

        const procedureMap = new Map<string, Procedure>();
        for (const rel of relations) {
            if (rel.procedure && rel.procedure.active) { // מוודא שהנוהל פעיל
                procedureMap.set(rel.procedure.id, rel.procedure);
            }
        }

        return Array.from(procedureMap.values());
    }


    @BackendMethod({allowed: true})
    static async getKnowledgeBaseSnapshot(): Promise<Category[]> {
        return await repo(Category).find({
            where: {active: true},
            orderBy: {importance: "desc"},
            include: {
                procedures: {
                    include: {
                        procedure: true
                    }
                }
            }
        });
    }

    @BackendMethod({allowed: UserRole.SuperAdmin})
    static async moveCategory(categoryId: string, newParentId: string | undefined) {
        const repo = remult.repo(Category);

        if (categoryId === newParentId) throw new Error("Category cannot be its own parent");

        await repo.update(categoryId, {parentCategoryId: newParentId});
    }
}
