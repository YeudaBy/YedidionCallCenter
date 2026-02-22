import {Allow, BackendMethod} from "remult";

export class FilesController {
    @BackendMethod({allowed: Allow.authenticated})
    static async uploadImage(base64Image: string): Promise<string> {
        if (typeof window !== "undefined") return "";

        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const sharp = (await import("sharp")).default;
        const {nanoid} = await import("nanoid");

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, {recursive: true});

        const fileName = `${nanoid(20)}.webp`;
        const filePath = path.join(uploadDir, fileName);

        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        await sharp(buffer)
            .resize(1200, null, {withoutEnlargement: true})
            .webp({quality: 80})
            .toFile(filePath);

        return `/uploads/${fileName}`;
    }
}
