import {createUploadthing, type FileRouter} from "uploadthing/next-legacy";
import {UploadThingError} from "uploadthing/server";
import {auth} from "@/pages/api/auth/[...nextauth]";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    imageUploader: f({image: {maxFileSize: "4MB"}})
        .middleware(async ({req, res}) => {
            const user = await auth(req, res);
            if (!user) throw new UploadThingError("Unauthorized");
            // @ts-ignore
            return {userId: user.id};
        })
        .onUploadComplete(async ({metadata, file}) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);
            return {uploadedBy: metadata.userId};
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
