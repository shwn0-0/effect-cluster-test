import { BunClusterSocket, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { User, SqlLayer } from "@template/domain";

const program = Effect.gen(function* () {
  yield* Effect.log("Running Client Test");

  // create client
  const makeClient = yield* User.UserEntity.client;
  const client = makeClient(`client-${Math.floor(Math.random())}`);

  yield* Effect.log("Created Client");

  // make requests
  const user1 = yield* client.CreateUser({
    email: User.Email.make("Test@Test.com"),
    name: "Bob Jones",
  });

  yield* Effect.log("Created Bob Jones");

  const user2 = yield* client.CreateUser({
    email: User.Email.make("Test2@Test.com"),
    name: "Ann Jones",
  });

  yield* Effect.log("Created Users");

  let users = yield* client.GetUsers();
  yield* Effect.log(users);

  yield* Effect.log(`Get User By Id (${user1.id})`);
  yield* client.GetUserById({ id: user1.id }).pipe(Effect.andThen(Effect.log));

  yield* Effect.log(`Get User by Email (${user2.email})`);
  yield* client
    .GetUserByEmail({ email: user2.email })
    .pipe(Effect.andThen(Effect.log));

  yield* Effect.log(`Delete User by Id (${user2.id})`);
  yield* client.DeleteUserById({ id: user2.id });
  users = yield* client.GetUsers();
  yield* Effect.log(users);

  yield* client
    .GetUserById({ id: user2.id })
    .pipe(
      Effect.catchTag("UserEntityError", ({ message }) =>
        Effect.logError(message),
      ),
    );

  yield* client.DeleteUserById({ id: user1.id });
  users = yield* client.GetUsers();
  yield* Effect.log(users);
}).pipe(Effect.catchAll((e) => Effect.logError(e)));

const ClientRuntime = BunClusterSocket.layer({
  clientOnly: true,
  storage: "sql",
}).pipe(Layer.provide(SqlLayer.Live));

program.pipe(Effect.provide(ClientRuntime), BunRuntime.runMain);
