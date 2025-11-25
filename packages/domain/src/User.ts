import { Entity } from "@effect/cluster";
import { Rpc } from "@effect/rpc";
import { Schema } from "effect";

const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;

export const Email = Schema.String.pipe(
  Schema.transform(Schema.String, {
    encode: (s) => s.toLowerCase(),
    decode: (s) => s,
  }),
  Schema.pattern(emailRegex),
);

export class User extends Schema.Class<User>("User")({
  email: Email,
  name: Schema.String,
  id: Schema.UUID,
}) {}

export class UserEntityError extends Schema.TaggedError<UserEntityError>(
  "UserEntityError",
)("UserEntityError", {
  message: Schema.String,
  cause: Schema.Option(Schema.Any),
}) {}

export const UserEntity = Entity.make("UserEntity", [
  Rpc.make("Ping"),
  Rpc.make("CreateUser", {
    payload: User.pipe(Schema.omit("id")),
    success: User,
    error: UserEntityError,
  }),
  Rpc.make("GetUsers", {
    success: Schema.Array(User),
    error: UserEntityError,
  }),
  Rpc.make("GetUserById", {
    payload: { id: Schema.UUID },
    success: User,
    error: UserEntityError,
  }),
  Rpc.make("GetUserByEmail", {
    payload: { email: Email },
    success: User,
    error: UserEntityError,
  }),
  Rpc.make("DeleteUserById", {
    payload: { id: Schema.UUID },
    success: Schema.UUID,
    error: UserEntityError,
  }),
]);
