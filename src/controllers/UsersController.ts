import {BackendMethod, remult} from "remult";
import {User} from "../model/User";

// export class UsersController {
//     @BackendMethod({allowed: true})
//     static async getUserByEmail(email: string): Promise<User | undefined> {
//         const userRepo = remult.repo(User);
//         return userRepo.findFirst({
//             email
//         })
//     }
// }
