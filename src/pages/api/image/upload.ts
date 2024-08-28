import {handleUpload, type HandleUploadBody} from '@vercel/blob/client';
import {NextApiRequest, NextApiResponse} from "next";

async function handler(req: NextApiRequest,
                       res: NextApiResponse) {
    const body = req.body as HandleUploadBody;
    console.log('body', body)

    try {
        const jsonResponse = await handleUpload({
            body,
            request: req,
            onBeforeGenerateToken: async (
                pathname,
            ) => {
                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                    tokenPayload: JSON.stringify({
                        procedureId: '123',
                    }),
                };
            },
            onUploadCompleted: async ({blob, tokenPayload}) => {
                console.log('blob upload completed', blob, tokenPayload);
            },
        });

        res.status(200).json(jsonResponse);
    } catch (error) {
        res.status(400).json({error: (error as Error).message});
    }
}

export default handler;
