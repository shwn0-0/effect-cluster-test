import { SqlClient } from "@effect/sql";
import { User } from "@template/domain";
import { Effect, Option, pipe, Schedule } from "effect";

export const UserEntityLive = User.UserEntity.toLayer(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT uuidv4(), name TEXT, email TEXT);`;

    return User.UserEntity.of({
      Ping: () => Effect.log("Pong"),
      CreateUser: ({ payload }) =>
        pipe(
          sql<User.User>`INSERT INTO users ${sql.insert(payload)} RETURNING *;`,
          Effect.andThen((users) => users[0]),
          Effect.catchTag(
            "SqlError",
            (e) =>
              new User.UserEntityError({
                message: e.message,
                cause: Option.some(e),
              }),
          ),
        ),
      GetUsers: () =>
        pipe(
          sql<User.User>`SELECT * FROM users;`,
          Effect.catchTag(
            "SqlError",
            (e) =>
              new User.UserEntityError({
                message: e.message,
                cause: Option.some(e),
              }),
          ),
        ),
      GetUserById: ({ payload }) =>
        pipe(
          sql<User.User>`SELECT * FROM users WHERE id = ${payload.id} LIMIT 1;`,
          Effect.andThen((users) =>
            users.length == 0
              ? Effect.fail(
                  new User.UserEntityError({
                    message: `User with id ${payload.id} does not exist`,
                    cause: Option.none(),
                  }),
                )
              : Effect.succeed(users[0]),
          ),
          Effect.catchTag(
            "SqlError",
            (e) =>
              new User.UserEntityError({
                message: e.message,
                cause: Option.some(e),
              }),
          ),
        ),

      GetUserByEmail: ({ payload }) =>
        pipe(
          sql<User.User>`SELECT * FROM users WHERE email = ${payload.email} LIMIT 1;`,
          Effect.andThen((users) =>
            users.length == 0
              ? Effect.fail(
                  new User.UserEntityError({
                    message: `User with email ${payload.email} does not exist`,
                    cause: Option.none(),
                  }),
                )
              : Effect.succeed(users[0]),
          ),
          Effect.catchTag(
            "SqlError",
            (e) =>
              new User.UserEntityError({
                message: e.message,
                cause: Option.some(e),
              }),
          ),
        ),
      DeleteUserById: ({ payload }) =>
        pipe(
          sql<{
            id: string;
          }>`DELETE FROM users WHERE id = ${payload.id} RETURNING id;`,
          Effect.andThen((ids) =>
            ids.length > 0
              ? Effect.succeed(ids[0].id)
              : Effect.fail(
                  new User.UserEntityError({
                    message: `User with id ${payload.id} cannot be deleted`,
                    cause: Option.none(),
                  }),
                ),
          ),
          Effect.catchTag(
            "SqlError",
            (e) =>
              new User.UserEntityError({
                message: e.message,
                cause: Option.some(e),
              }),
          ),
        ),
    });
  }).pipe(Effect.orDie),
  { defectRetryPolicy: Schedule.forever },
);
