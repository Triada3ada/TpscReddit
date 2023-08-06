import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Resolver,
  Query,
  Mutation,
  FieldResolver,
  Root,
  Ctx,
  Arg,
  InputType,
  Field,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";
import { log } from "console";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(()=>[FieldError], {nullable:true})
  errors?: FieldError[]

  @Field(()=>User, {nullable:true})
  user?: User
}

@Resolver(User)
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) : Promise<UserResponse>{

    if (options.username.length <= 2) {
      return{
        errors:[{
          field: 'username',
          message: 'length must be greater than 2'
        }]
      }
    }

    if (options.password.length <= 2) {
      return{
        errors:[{
          field: 'password',
          message: 'length must be greater than 2'
        }]
      }
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (error) {
      if (error.code==="23505") {
        //duplicate username error
        return{
          errors:[{
            field: 'username',
            message: 'this username already exists'
          }]
        }
      }
      console.log("message", error);
      
    }
    return {user};
  }

  @Mutation(()=>UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) : Promise<UserResponse> {
    const user = await em.findOne(User, {username:options.username})    
    if(!user){      
      return{
        errors:[{
          field: 'username',
          message: 'that username doesnt exist'
        }]
      }
    }

    const valid = await argon2.verify(user.password, options.password);
    if(!valid){
      return{
        errors:[{
          field: 'password',
          message: 'incorrect password'
        }]
      }
    }
    return {user};
  }

  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and its ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // current user wants to see someone elses email
    return "";
  }
}
