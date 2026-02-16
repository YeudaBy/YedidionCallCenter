import React, {useEffect, useState} from "react";
import {buildTree, CategoryNode} from "@/utils/ui";
import {Category} from "@/model/Category";
import {remult} from "remult";
import {Button, Text} from "@tremor/react";
import {RiAddLine} from "@remixicon/react";
import {CategoryAdminItem} from "@/components/node/CategoryAdminItem";
import {CategoryEditorDialog} from "@/components/dialogs/CategoryEditDialog";

export default function CategoryAdminPage() {
    const [treeData, setTreeData] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandKey, setExpandKey] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

    const fetchData = async () => {
        setLoading(true);
        const flatList = await remult.repo(Category).find({
            orderBy: {importance: "desc"}
        });
        setTreeData(buildTree(flatList));
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExpandAll = () => {
        setExpandKey(prev => prev + 1);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <Text className={"text-2xl font-bold"}>ניהול עץ קטגוריות</Text>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExpandAll}>פרוס/צמצם הכל</Button>
                    <Button icon={RiAddLine} onClick={() => {
                        setSelectedCategory(undefined);
                        setIsDialogOpen(true);
                    }}>קטגוריה חדשה</Button>
                </div>
            </div>

            {loading ? <Text>טוען...</Text> : (
                <div className="bg-white shadow rounded-xl p-4">
                    {treeData.map(node => (
                        <CategoryAdminItem
                            key={`${node.id}-${expandKey}`}
                            node={node}
                            onEdit={(cat) => {
                                setSelectedCategory(cat);
                                setIsDialogOpen(true);
                            }}
                            onRefresh={fetchData}
                        />
                    ))}
                </div>
            )}

            <CategoryEditorDialog
                open={isDialogOpen}
                category={selectedCategory}
                onClose={() => setIsDialogOpen(false)}
                onSave={fetchData}
            />
        </div>
    );
}
