import path from "path";
import { _prod_ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

import { Options } from "@mikro-orm/core";


const config: Options = {
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/ /*regex pattern for the migration files*/,
  },
  entities: [Post, User],
  dbName: "lireddit",
  type: "postgresql",
  debug: !_prod_,
};

export default config;
