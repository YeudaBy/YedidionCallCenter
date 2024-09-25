import {NextApiRequest, NextApiResponse} from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'POST': {
            const message = req.body;
            console.log(message);
            res.status(200).json({success: true});
        }
            break
        case 'GET': {
            const verify_token = process.env.WA_VERIFY_TOKEN;
            const {'hub.verify_token': token, 'hub.challenge': challenge} = req.query;
            if (token === verify_token) {
                res.status(200).send(challenge);
            } else {
                res.status(403).send('Verification failed');
            }
        }
            break
        default:
            res.status(405).end() // Method Not Allowed
            break
    }
}
