import { Bool, Schema, Text, U64 } from "@truenetworkio/sdk"

export const MemeTemplateSchema = Schema.create({
  cid: Text,
  isTemplate: Bool,
})

export const MemeSchema = Schema.create({
  cid: Text,
  isTemplate: Bool,
  memeTemplate: U64,
});