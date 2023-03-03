import { Post, PrismaClient } from "@prisma/client"

const db = new PrismaClient()

export const allPosts = async () => {
    const posts = await db.post.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    })

    return posts
}

export const postByID = async (id: string) => {
    const posts = await db.post.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    })

    return posts
}

export const createPost = async (input: Post) => {
    const newPost = await db.post.create({ data: input })

    return newPost
}

export const deletePost = async (id: string) => {
    const deletedPost = await db.post.delete({ where: { id } })

    return deletedPost
}

export const updatePost = async (id: string, input: Post) => {
    const updatedPost = await db.post.update({ where: { id }, data: input })

    return updatedPost
}
