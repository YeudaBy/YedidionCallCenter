import {useDropzone} from "react-dropzone";
import {FilesController} from "@/controllers/FilesController";
import {toast} from "sonner";
import {Card, Icon, Text} from "@tremor/react";
import {RiDragDropLine} from "@remixicon/react";

export function ImageUploader({onUploadSuccess}: {
    onUploadSuccess: (imageUrl: string) => void;
}) {
    const {getRootProps, getInputProps} = useDropzone({
        accept: {'image/*': []},
        multiple: false,
        onDrop: async (acceptedFiles) => {
            try {
                const file = acceptedFiles[0];
                const reader = new FileReader();

                reader.onload = async () => {
                    const base64 = reader.result as string;
                    const imageUrl = await FilesController.uploadImage(base64);
                    onUploadSuccess(imageUrl);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                toast.error("שגיאה בהעלאת התמונה. אנא נסה שוב.");
                console.error("Image upload error:", error);
            }
        }
    });

    return (
        <Card {...getRootProps()} className="items-center justify-center m-auto flex-col flex
         gap-2 border-dashed border p-4 cursor-pointer shadow-none">
            <input {...getInputProps()}/>
            <Icon icon={RiDragDropLine} size={"lg"} variant={"light"}/>
            <Text>
                גרור ושחרר תמונה כאן, או לחץ כדי לבחור קובץ
            </Text>
        </Card>
    )
        ;
}
