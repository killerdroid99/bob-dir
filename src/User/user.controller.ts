import { PrismaClient, User } from "@prisma/client"
import bcrypt from "bcrypt"
import { Request, Response } from "express"
import { LoginRequest } from "../types"

const db = new PrismaClient()

export const userSignup = async (input: User) => {
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = await bcrypt.hash(input.password, salt)

    const { password, ...newUser } = await db.user.create({
        data: { ...input, password: hashedPassword },
    })

    return {
        ...newUser,
        msg: `User account of ${newUser.name} created successfully`,
    }
}

export const userLogin = async (req: LoginRequest, res: Response) => {
    const user = await db.user.findUnique({
        where: {
            email: req.body.email,
        },
    })

    if (!user) {
        return res.status(404).json({ msg: "User does not exists" })
    }

    const { password, createdAt, ...userCookieData } = user

    const deCryptedPassword = await bcrypt.compare(
        req.body.password,
        user.password
    )

    if (!deCryptedPassword) {
        return res.status(401).json({ msg: "Invalid credentials" })
    }

    req.session.user = userCookieData

    return res.status(200).json({ msg: "Successfully logged in" })
}

export const userSignupAndLogin = async (req: Request, res: Response) => {
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const { password, createdAt, ...newUser } = await db.user.create({
        data: { ...req.body, password: hashedPassword },
    })

    const userCookieData = newUser

    req.session.user = userCookieData

    return res.status(200).json({
        msg: `Successfully created account of ${newUser.name} and logged in`,
    })
}

export const userStatus = async (req: Request, res: Response) => {
    if (!req.session.user) {
        return res.status(404).json({ msg: "No saved session found" })
    }

    return res.json(req.session.user)
}

export const userLogout = async (req: Request, res: Response) => {
    if (!req.session.user) {
        return res.status(404).json({ msg: "No saved session found" })
    }

    req.session.destroy((err) => {
        console.log(err)
    })

    return res.status(200).json({ msg: "Successfully logged out" })
}
