import 'reflect-metadata'
import { MikroORM } from "@mikro-orm/core";
import { _prod_ } from "./constants";
//import { Post } from "./entities/Post";
import mikroConfig from './mikro-orm.config'
require('dotenv').config()
import express from 'express'
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from './resolvers/user';
import RedisStore from "connect-redis"
import session from "express-session"
import {createClient} from "redis"
import { MyContext } from './types';




const main = async () => {
  
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  const app = express();

  // Initialize client.
  const redisClient = createClient()
  redisClient.connect().catch(console.error)

// Initialize store.
  const redisStore = new RedisStore({
   client: redisClient,
   prefix: "myapp:",   
   disableTouch: true,

  })

// Initialize sesssion storage.
  app.use(
    session({
      name: 'qid',
      store: redisStore,
      cookie: {
        maxAge: 1000 * 60 * 60 *24 * 365 * 10, //forever 10 years
        httpOnly: true,
        // check for env varivale later to make it work with https later
        //secure: __prod__
        sameSite: 'lax' //csrf lol
      },
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: process.env.SESSION_SECRET,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({req, res}) : MyContext => ({em: orm.em, req, res})
  })
  await apolloServer.start()
  apolloServer.applyMiddleware({app})

  app.listen(4000,()=>{
    console.log('server lisnte on 4000');
  });
  
  // const post = orm.em.create(Post, { title: "my first post" });
  // await orm.em.persistAndFlush(post);
  // const posts = await orm.em.find(Post,{})
  // console.log(posts);
  
};

main().catch((err) => {
  console.error(err);
});

console.log("hey");
