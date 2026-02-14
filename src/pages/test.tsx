import React, {useEffect, useState} from "react";
import {remult} from "remult";
import {Category} from "@/model/Category";
import {buildTree, CategoryNode} from "@/utils/ui";
import {CategoryItem} from "@/components/node/CategoryItem";

export default function Test() {

    const [treeData, setTreeData] = useState<CategoryNode[]>([]);

    useEffect(() => {
        remult.repo(Category).find({
            include: {
                procedures: { include: { procedure: true } }
            }
        }).then(flatList => {
            const tree = buildTree(flatList);
            setTreeData(tree);
        });
    }, []);

    return (
        <div className="kb-container">
            <div className="tree-view border-2 m-4 rounded">
                {treeData.map(rootNode => (
                    <CategoryItem key={rootNode.id} node={rootNode} />
                ))}
            </div>
        </div>
    );
}
