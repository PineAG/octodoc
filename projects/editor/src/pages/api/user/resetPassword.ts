import * as t from "io-ts"
import { asAPI } from "@/lib/apiUtils";

const ResetPasswordRequest = t.type({
    oldPassword: t.string,
    newPassword: t.string
})

export default asAPI("POST", ResetPasswordRequest, async (req, user) => {
    return {message: "OK"}
})
