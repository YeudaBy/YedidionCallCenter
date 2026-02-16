import React, {useEffect, useState} from "react";
import {buildTree, CategoryNode} from "@/utils/ui";
import {remult} from "remult";
import {Category} from "@/model/Category";
import {CategoryItem} from "@/components/node/CategoryItem";
import {Text} from "@tremor/react";

export function NodeMenu({onProcedureSelect}: { onProcedureSelect: (procId: string) => void }) {
    const [treeData, setTreeData] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        remult.repo(Category).find({
            include: {
                procedures: {include: {procedure: true}}
            },
            orderBy: {
                importance: "desc",
            }
        }).then(flatList => {
            const tree = buildTree(flatList);
            setTreeData(tree);
        }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="kb-container">
            {
                loading ? <>
                        <Text className={"text-center text-lg mt-2"}>טוען קטגוריות...</Text>
                    </>
                    : <div className="tree-view border-2 rounded-xl p-4 md:p-0">
                        {treeData.map(rootNode => (
                            <CategoryItem
                                key={rootNode.id}
                                node={rootNode}
                                onProcedureSelect={onProcedureSelect}
                            />
                        ))}
                    </div>
            }
        </div>
    );
}
