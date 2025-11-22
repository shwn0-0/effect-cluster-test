import { Config, Effect, Layer, Option } from "effect";
import { BunClusterSocket, BunRuntime } from "@effect/platform-bun";
import { RunnerAddress } from "@effect/cluster";
import { UserEntityLive } from "./UserEntityLive.js";
import { SqlLayer } from "@template/domain";

// launch runner
const RunnerRuntime = Effect.gen(function* () {
  const hostname = yield* Config.string("HOSTNAME").pipe(
    Config.withDefault("localhost"),
  );
  const port = yield* Config.number("PORT").pipe(Config.withDefault(34431));
  return BunClusterSocket.layer({
    storage: "sql",
    shardingConfig: {
      runnerAddress: Option.some(RunnerAddress.make(hostname, port)),
    },
  });
}).pipe(Layer.unwrapEffect, Layer.provideMerge(SqlLayer.Live));

UserEntityLive.pipe(
  Layer.provide(RunnerRuntime),
  Layer.launch,
  BunRuntime.runMain,
);
