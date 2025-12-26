
export const sanitizeAccount = (account: any) => ({
    id: account.id,
    name: account.name,
    username: account.username,
    email: account.email,
    avatar: account.avatar,
    phone: account.phone,
    address: account.address,
    role: {
        id: account.role.id,
        name: account.role.name,
        permissions: account.role.permissions,
    },
})
