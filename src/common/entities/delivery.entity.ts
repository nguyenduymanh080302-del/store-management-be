export class DeliveryEntity {
    id: number;
    name: string;
    email?: string | null;
    phone: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
