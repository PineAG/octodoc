import t from "io-ts"

export const BatchMoveRequest = t.type({
    files: t.array(t.array(t.string)),
    target: t.array(t.string)
})

export type BatchMoveRequestType = t.TypeOf<typeof BatchMoveRequest>
