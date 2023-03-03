import express from "express"
import session from "express-session"
import * as dotenv from "dotenv"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import {
    userLogin,
    userLogout,
    userSignup,
    userSignupAndLogin,
    userStatus,
} from "./User/user.controller"
import {
    allPosts,
    createPost,
    deletePost,
    postByID,
    updatePost,
} from "./Post/post.controller"

dotenv.config()
declare module "express-session" {
    export interface SessionData {
        user: { [key: string]: any }
    }
}

const app = express()

const books = [
    {
        id: 1,
        name: "a",
    },
    {
        id: 2,
        name: "b",
    },
    {
        id: 3,
        name: "c",
    },
]

const prisma = new PrismaClient()

const main = async () => {
    app.set("trust proxy", 1)

    app.use(express.json())

    app.use(express.urlencoded({ extended: true }))

    app.use(
        cors({
            origin:
                process.env.NODE_ENV === "development"
                    ? "* "
                    : process.env.CLIENT_URL,
            credentials: true,
        })
    )

    app.use(
        session({
            secret: process.env.COOKIE_SECRET as string,
            resave: false,
            saveUninitialized: true,
            name: process.env.COOKIE_NAME as string,
            cookie: {
                secure: false,
                sameSite: "lax",
                httpOnly: true,
                maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days
            },
        })
    )

    // User Stuff

    app.get("/", (req, res) => {
        return res.json(books)
    })

    app.post("/auth/signup", async (req, res) => {
        const user = await userSignup(req.body)
        if (!user) {
            return res.status(400)
        }
        return res.status(201).json(user)
    })

    app.post("/auth/login", async (req, res) => {
        await userLogin(req, res)
    })

    app.post("/auth/signup-and-login", async (req, res) => {
        await userSignupAndLogin(req, res)
    })

    app.get("/auth/status", async (req, res) => {
        userStatus(req, res)
    })

    app.post("/auth/logout", async (req, res) => {
        userLogout(req, res)
    })

    // Post Stuff

    app.get("/posts", async (req, res) => {
        return res.json(await allPosts())
    })

    app.get("/posts/:id", async (req, res) => {
        return res.json(await postByID(req.params.id))
    })

    app.post("/posts", async (req, res) => {
        if (!req.session.user) {
            return res.status(401).send({ msg: "you are not authenticated" })
        }

        const post = await createPost({
            ...req.body,
            title: req.body.title as string,
            body: req.body.body as string,
            user_id: req.session.user.id as string,
        })

        return res.json({ ...post, msg: "post created successfully" })
    })

    app.delete("/posts/:id", async (req, res) => {
        if (!req.session.user) {
            return res.status(401).send({ msg: "you are not authenticated" })
        }

        const post = await deletePost(req.params.id)

        return res.json({ ...post, msg: "post deleted successfully" })
    })

    app.put("/posts/:id", async (req, res) => {
        if (!req.session.user) {
            return res.status(401).send({ msg: "you are not authenticated" })
        }

        const post = await updatePost(req.params.id, {
            ...req.body,
            title: req.body.title as string,
            body: req.body.body as string,
            user_id: req.session.user.id as string,
        })

        return res.json({ ...post, msg: "post updated successfully" })
    })

    app.listen(process.env.PORT || 4000, () => {
        console.log("server ready")
    })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
