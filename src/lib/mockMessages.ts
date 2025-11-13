export const mockMessages = [
    {
        id: "1",
        sessionId: "s1",
        buyerId: "u1",
        sellerId: "s1",
        sellerName: "TechStore Official",
        isActive: true,
        messages: [
            {
                id: "m1",
                senderType: "buyer",
                senderId: "u1",
                content: "Hi, is this laptop still available?",
                isRead: true,
                createdAt: new Date(),
            },
            {
                id: "m2",
                senderType: "seller",
                senderId: "s1",
                content: "Yes! We have 3 units left.",
                isRead: false,
                createdAt: new Date(),
            },
        ],
    },
    {
        id: "2",
        sessionId: "s2",
        buyerId: "u2",
        sellerId: "s2",
        sellerName: "FashionHub",
        isActive: true,
        messages: [
            {
                id: "m3",
                senderType: "buyer",
                senderId: "u2",
                content: "Do you ship internationally?",
                isRead: false,
                createdAt: new Date(),
            },
        ],
    },
];
